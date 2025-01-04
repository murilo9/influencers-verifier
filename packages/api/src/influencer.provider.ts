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
}
