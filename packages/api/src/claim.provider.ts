import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import * as crypto from "crypto";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import { DatabaseService } from "./database.provider";
import { ObjectId, WithoutId } from "mongodb";
import { InfluencerProfile } from "./types/influencer-profile";
import { InfluencerPost } from "./types/influencer-post";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import OpenAI, { InternalServerError } from "openai";
import { ConfigService } from "@nestjs/config";
import { getClaimExtractionPrompt } from "./helpers/get-claim-extraction-prompt";
import { Claim } from "./types/claim";
import { SentenceEncoderProvider } from "./sentence-encoder.provider";

type PrebuiltClaim = {
  influencerId: string;
  claim: string;
  originalText: string;
  postUrl: string;
  categories: Array<string>;
};

type ClaimsExtractedPayload = {
  claims: Array<PrebuiltClaim>;
};

@Injectable()
export class ClaimService {
  private openAi: OpenAI;

  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(SentenceEncoderProvider)
    private sentenceEncoderProvider: SentenceEncoderProvider,
    private eventEmitter: EventEmitter2
  ) {
    this.openAi = new OpenAI({
      apiKey: configService.get("OPENAI_API_KEY"),
    });
  }

  private async areClaimsSimilar(
    claim1: string,
    claim2: string,
    threshold = 0.8
  ) {
    if (claim1 === claim2) {
      return true;
    }
    console.log("claim1", claim1);
    console.log("claim2", claim2);
    const model = this.sentenceEncoderProvider.model;
    const embeddings = await model.embed([claim1, claim2]);
    const similarity = embeddings.dot(embeddings.transpose()).arraySync()[0][1];
    console.log("similarity", similarity);

    return similarity >= threshold;
  }

  // This may take VERY long
  private async getDuplicatedClaims(
    prebuiltClaims: Array<PrebuiltClaim>,
    existingClaims: Array<Claim>
  ): Promise<Array<PrebuiltClaim & { duplicateOf: ObjectId | null }>> {
    const filteredPrebuiltClaims: Array<
      PrebuiltClaim & { duplicateOf: ObjectId | null }
    > = [];
    for (let i = 0; i < prebuiltClaims.length; i++) {
      const currentPrebuiltClaim = prebuiltClaims[i];
      const prebuiltClaimText = currentPrebuiltClaim.claim;
      let duplicateOf: ObjectId | null = null;
      for (let j = 0; j < existingClaims.length; j++) {
        const existingClaimText = existingClaims[j].normalizedClaim;
        const areClaimsSimilar = await this.areClaimsSimilar(
          prebuiltClaimText,
          existingClaimText
        );
        if (areClaimsSimilar) {
          duplicateOf = existingClaims[j]._id;
          break;
        }
      }
      filteredPrebuiltClaims.push({ ...currentPrebuiltClaim, duplicateOf });
    }
    return filteredPrebuiltClaims;
  }

  /**
   * Extracts claims from posts. Once done, emmits a 'claims.extracted' event.
   * @param posts
   * @returns
   */
  private async extractClaimsFromPosts(
    posts: Array<InfluencerPost>
  ): Promise<void> {
    console.log("extracting claims begin");
    const prompt = getClaimExtractionPrompt(posts);
    const completion = await this.openAi.chat.completions.create(prompt);
    const response = completion.choices[0];
    if (!response.message.content) {
      console.log("will throw assistant error:", response);
      throw new InternalServerErrorException(
        "No message content from assistant"
      );
    }
    const payload = JSON.parse(
      response.message.content
    ) as ClaimsExtractedPayload;
    // Converts all claims' text to lowercase
    payload.claims = payload.claims.map((claim) => ({
      ...claim,
      claim: claim.claim.toLowerCase(),
    }));
    this.eventEmitter.emit("claims.extracted", payload);
  }

  @OnEvent("claims.extracted")
  private async onClaimsExtracted(payload: ClaimsExtractedPayload) {
    console.log("claims extracted");
    const existingClaims: Array<Claim> = await this.databaseService.db
      .collection<Claim>("claims")
      .find()
      .toArray();
    const prebuiltClaims = payload.claims;
    // Removes duplicated prebuilt claims
    const markedPrebuiltClaims = await this.getDuplicatedClaims(
      prebuiltClaims,
      existingClaims
    );
    // Adds the claims that are not duplicates in the database
    const claimsToAdd = markedPrebuiltClaims.filter(
      (prebuiltClaim) => prebuiltClaim.duplicateOf === null
    );
    await this.addClaims(claimsToAdd);
    // Attaches influencer source to the claims
    for (const prebuiltClaim of markedPrebuiltClaims) {
      const filter = prebuiltClaim.duplicateOf
        ? { _id: prebuiltClaim.duplicateOf }
        : { normalizedClaim: prebuiltClaim.claim };
      let claimToUpdate = await this.databaseService.db
        .collection<Claim>("claims")
        .findOne(filter);
      if (!claimToUpdate) {
        throw new InternalServerErrorException(
          "Could not locate claim to update: " + prebuiltClaim.claim
        );
      }
      claimToUpdate.sources[prebuiltClaim.influencerId] = {
        originalText: prebuiltClaim.originalText,
        postUrl: prebuiltClaim.postUrl,
      };
      await this.databaseService.db
        .collection<WithoutId<Claim>>("claims")
        .updateOne(
          { _id: claimToUpdate._id },
          { $set: { sources: claimToUpdate.sources } }
        );
      console.log("a claim source was updated");
    }
  }

  /**
   * Uniequify claims. Transform prebuilt claims into unique claims and inserts them
   * in the database if their hash does not exist yet.
   * @param prebuildClaims List of prebuilt claims, with no duplicated claims.
   */
  public async addClaims(prebuiltClaims: Array<PrebuiltClaim>): Promise<void> {
    for (const prebuiltClaim of prebuiltClaims) {
      const claimDto: WithoutId<Claim> = {
        normalizedClaim: prebuiltClaim.claim,
        verificationStatus: "unverified",
        categories: prebuiltClaim.categories,
        sources: {},
      };
      await this.databaseService.db
        .collection<WithoutId<Claim>>("claims")
        .insertOne(claimDto);
      console.log("a claim was added");
    }
  }

  /**
   * Extracts claims from a influencer's posts. The claims are left with 'unverified' state.
   * Ideally, all posts from all social networks should already be fetched.
   * @param influencerId
   */
  public async processateInfluencerPosts(influencerId: ObjectId) {
    console.log("processating influencer posts begin");
    const influencer = await this.databaseService.db
      .collection<InfluencerProfile>("influencers")
      .findOne({ _id: influencerId });
    if (!influencer) {
      throw new NotFoundException("Influencer not registered yet");
    }
    const posts = await this.databaseService.db
      .collection<InfluencerPost>("influencerPosts")
      .find({
        influencerId,
      })
      .toArray();
    this.extractClaimsFromPosts(posts);
  }

  public async verifyUnverifiedClaims() {}
}
