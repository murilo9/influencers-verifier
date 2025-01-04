import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import crypto from "crypto";
import { InfluencerClaim } from "./types/influencer-claim";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import { DatabaseService } from "./database.provider";
import { ObjectId } from "mongodb";
import { InfluencerProfile } from "./types/influencer-profile";

async function areClaimsSimilar(claim1, claim2, threshold = 0.85) {
  const model = await use.load();
  const embeddings = await model.embed([claim1, claim2]);

  const similarity = embeddings.dot(embeddings.transpose()).arraySync()[0][1];

  return similarity >= threshold;
}

@Injectable()
export class ClaimService {
  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService
  ) {}

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
        const previousClaimIsSimilar = await areClaimsSimilar(
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
   * Fetches claims from an influencer profile and save them
   * @param influencerId
   */
  public async fetchClaimsFor(
    influencerId: ObjectId,
    socialNetwork: "instagram"
  ) {
    const influencer = await this.databaseService.db
      .collection<InfluencerProfile>("influencers")
      .findOne({ _id: influencerId });
    if (!influencer) {
      throw new NotFoundException("Influencer not registered yet");
    }
  }

  public async verifyUnverifiedClaims() {}
}
