import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import * as crypto from "crypto";
import { InfluencerClaim } from "./types/influencer-claim";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import { DatabaseService } from "./database.provider";
import { ObjectId, WithoutId } from "mongodb";
import { InfluencerProfile } from "./types/influencer-profile";
import { InfluencerPost } from "./types/influencer-post";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import OpenAI, { InternalServerError } from "openai";
import { ConfigService } from "@nestjs/config";
import { getClaimExtractionPrompt } from "./helpers/get-claim-extraction-prompt";
import { UniqueClaim } from "./types/unique-claim";

type PrebuiltClaim = {
  influencerId: string;
  claim: string;
  originalText: string;
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
    private eventEmitter: EventEmitter2
  ) {
    this.openAi = new OpenAI({
      apiKey: configService.get("OPENAI_API_KEY"),
    });
  }

  static async areClaimsSimilar(
    claim1: string,
    claim2: string,
    threshold = 0.85
  ) {
    const model = await use.load();
    const embeddings = await model.embed([claim1, claim2]);

    const similarity = embeddings.dot(embeddings.transpose()).arraySync()[0][1];

    return similarity >= threshold;
  }

  static getClaimHash(text: string) {
    const normalizedText = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .replace(/\b(the|and|is|a|an|of|to|in|on|at|for)\b/g, "") // Remove stop words
      .trim() // Trim whitespace
      .split(/\s+/) // Split into words
      .sort() // Sort words
      .join(" "); // Join words back
    const hash = crypto.createHash("md5").update(normalizedText).digest("hex");
    return hash;
  }

  static async removeDuplicatedClaims(
    claims: Array<PrebuiltClaim>
  ): Promise<Array<PrebuiltClaim>> {
    const filteredClaims: Array<PrebuiltClaim> = [claims[0]];
    for (let i = 0; i < claims.length; i++) {
      if (i > 0) {
        const currentClaim = claims[i];
        const currentClaimText = claims[i].claim;
        const previousClaimText = claims[i - 1].claim;
        const previousClaimIsSimilar = await this.areClaimsSimilar(
          currentClaimText,
          previousClaimText
        );
        if (!previousClaimIsSimilar) {
          filteredClaims.push(currentClaim);
        }
      }
    }
    return filteredClaims;
  }

  /**
   * Extracts claims from posts. Once done, emmits a 'claims.extracted' event.
   * @param posts
   * @returns
   */
  private async extractClaimsFromPosts(
    posts: Array<InfluencerPost>
  ): Promise<void> {
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
    this.eventEmitter.emit("claims.extracted", payload);
  }

  @OnEvent("claims.extracted")
  private async onClaimsExtracted(payload: ClaimsExtractedPayload) {
    console.log("claims extracted");
    console.log(payload);
    const prebuiltClaims = payload.claims;
    // Removes duplicated prebuilt claims
    const filteredPrebuiltClaims = await ClaimService.removeDuplicatedClaims(
      prebuiltClaims
    );
    // Uniquefy the prebuilt claims and save in the database
    await this.uniquefyClaims(filteredPrebuiltClaims);
  }

  /**
   * Uniequify claims. Transform prebuilt claims into unique claims and inserts them
   * in the database if their hash does not exist yet.
   * @param prebuildClaims List of prebuilt claims, with no duplicated claims.
   */
  public async uniquefyClaims(
    prebuiltClaims: Array<PrebuiltClaim>
  ): Promise<void> {
    console.log("prebuilt claims", prebuiltClaims);
    const influencerClaims: Array<WithoutId<InfluencerClaim>> = [];
    const existingUniqueClaims = (
      await this.databaseService.db
        .collection<WithoutId<UniqueClaim>>("uniqueClaims")
        .find()
        .toArray()
    ).reduce(
      (store, uniqueClaim) => ({ ...store, [uniqueClaim.hash]: uniqueClaim }),
      {} as Record<string, UniqueClaim>
    );
    for (const prebuiltClaim of prebuiltClaims) {
      const claimHash = ClaimService.getClaimHash(prebuiltClaim.claim);
      let uniqueClaimId: ObjectId | undefined =
        existingUniqueClaims[claimHash]?._id;
      // If this claim is not unique yet, registers it in the database
      if (!uniqueClaimId) {
        const insertResult = await this.databaseService.db
          .collection<WithoutId<UniqueClaim>>("uniqueClaims")
          .insertOne({
            hash: claimHash,
            verificationStatus: "unverified",
          });
        uniqueClaimId = insertResult.insertedId;
        console.log("a unique claim was created");
      }
      // Builds the influencer claim
      const influencerClaim: WithoutId<InfluencerClaim> = {
        influencerId: new ObjectId(prebuiltClaim.influencerId),
        originalText: prebuiltClaim.originalText,
        uniqueClaimId,
      };
      // Adds it to the array of influencer claims to be created
      influencerClaims.push(influencerClaim);
    }
    console.log("influencerClaims", influencerClaims);
    // Finally, registers all influencer claims in the database
    await this.databaseService.db
      .collection<WithoutId<InfluencerClaim>>("influencerClaims")
      .insertMany(influencerClaims);
  }

  /**
   * Extracts claims from a influencer's posts. The claims are left with 'unverified' state.
   * Ideally, all posts from all social networks should already be fetched.
   * @param influencerId
   */
  public async processateInfluencerPosts(influencerId: ObjectId) {
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
