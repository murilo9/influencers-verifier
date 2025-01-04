import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ApifyService } from "./apify.provider";
import { DatabaseService } from "./database.provider";
import { ObjectId } from "mongodb";
import { ClaimService } from "./claim.provider";
import { InfluencerClaim } from "./types/influencer-claim";
import { UniqueClaim } from "./types/unique-claim";
import { InfluencerProfile } from "./types/influencer-profile";
import { getSlug } from "./helpers/get-slug";

@Injectable()
export class InfluencerService {
  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(ApifyService) private apifyService: ApifyService
  ) {}

  /**
   *  Optimistically adds an influencer's claim.
   * @param influencerId Name of the influencer
   * @param text Original claim text from social media post
   */
  private async addInfluencerClaims(
    influencerId: ObjectId,
    claimsTexts: string[]
  ) {
    const influencer = (await this.databaseService.db
      .collection("influencers")
      .findOne({ _id: influencerId })) as InfluencerProfile;
    const filteredClaims = await ClaimService.removeDuplicatedClaims(
      claimsTexts
    );
    // Prepare the list of influencer claims
    const influencerClaims: Array<Omit<InfluencerClaim, "_id">> = [];
    // For each filtered text claim
    for (const claim of filteredClaims) {
      const claimHash = ClaimService.getClaimHash(claim);
      // Looks for a unique claim with this hash
      let uniqueClaim = await this.databaseService.db
        .collection("uniqueClaims")
        .findOne<UniqueClaim>({ hash: claimHash });
      // If there is no unique claim yet, create it
      if (!uniqueClaim) {
        const insertResult = await this.databaseService.db
          .collection("uniqueClaims")
          .insertOne({
            hash: claimHash,
            verificationStatus: "unverified",
          });
        uniqueClaim = {
          _id: insertResult.insertedId,
          hash: claimHash,
          verificationStatus: "unverified",
        };
      }
      // Mounts the influencer claim
      const influencerClaim: Omit<InfluencerClaim, "_id"> = {
        influencerId: influencer._id,
        originalText: claim,
        uniqueClaimId: uniqueClaim._id,
      };
      // Appends the influencer claim in the influencer claims list
      influencerClaims.push(influencerClaim);
    }
    // Finally, saves all the influencer claims
    await this.databaseService.db
      .collection("influencerClaims")
      .insertMany(influencerClaims);
  }

  /**
   * Retrieves the profile of an influencer
   * @param name Non-slugged name of the influencer
   */
  async influencerLookup(name: string) {
    const slug = getSlug(name);
    const influencer = await this.databaseService.db
      .collection<InfluencerProfile>("influencers")
      .findOne({ slug });
    if (!influencer) {
      throw new NotFoundException("Influencer not registered yet");
    }
    return influencer;
  }

  async registerInfluencer(name: string) {
    const slug = getSlug(name);
    const influencerExists = await this.databaseService.db
      .collection<InfluencerProfile>("influencers")
      .findOne({ slug });
    if (influencerExists) {
      throw new BadRequestException("Influencer is already registered");
    }
    // Fetches influencer's social profiles
    const influencerData = {
      name,
      slug,
      socialProfile: {
        facebook: null,
        instagram: null,
        tiktok: null,
        twitter: null,
        youtube: null,
      },
    };
    const socialProfiles = await this.apifyService.fetchInfluencer(name);
    // Attaches social profiles to influencer's profile
    socialProfiles.forEach(
      (socialProfile) =>
        (influencerData.socialProfile[socialProfile.social] =
          socialProfile.socialProfileUrl)
    );
    // Inserts influencer's profile in the database
    const inserResult = await this.databaseService.db
      .collection("influencers")
      .insertOne(influencerData);
    const influencerProfile: InfluencerProfile = {
      _id: inserResult.insertedId,
      ...influencerData,
    };
    return influencerProfile;
  }

  async fetchClaims(
    influencerId: ObjectId,
    socialNetwork: "instagram" | "facebook"
  ) {
    return this.apifyService.fetchPosts(influencerId, socialNetwork);
  }
}
