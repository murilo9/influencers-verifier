import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import crypto from "crypto";
import { InfluencerClaim } from "./types/influencer-claim";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import { DatabaseService } from "./database.provider";
import { ObjectId } from "mongodb";
import { InfluencerProfile } from "./types/influencer-profile";
import { InfluencerPost } from "./types/influencer-post";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import OpenAI, { InternalServerError } from "openai";
import { ConfigService } from "@nestjs/config";
import { getClaimExtractionPrompt } from "./helpers/get-claim-extraction-prompt";

type PrebuiltClaim = {
  influencerId: string;
  claim: string;
};

type ClaimsExtractedPayload = {
  claims: Array<InfluencerClaim>;
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

  static async areClaimsSimilar(claim1, claim2, threshold = 0.85) {
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
    claims: Array<string>
  ): Promise<Array<string>> {
    const filteredClaims: Array<string> = [claims[0]];
    for (let i = 0; i < filteredClaims.length; i++) {
      if (i > 0) {
        const currentClaim = filteredClaims[i];
        const previousClaim = filteredClaims[i - 1];
        const previousClaimIsSimilar = await this.areClaimsSimilar(
          currentClaim,
          previousClaim
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
    const payload = JSON.parse(response.message.content) as {
      claims: Array<PrebuiltClaim>;
    };
    this.eventEmitter.emit("claims.extracted", payload);
  }

  @OnEvent("claims.extracted")
  private async onClaimsExtracted(payload: ClaimsExtractedPayload) {
    console.log("claims extracted");
    console.log(payload);
    // TODO: filter duplicated claims and save InfluencerClaims and uniquefy claims
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
