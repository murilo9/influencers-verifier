import {
  BadRequestException,
  Get,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ApifyService } from "./apify.provider";
import { DatabaseService } from "./database.provider";
import { InfluencerProfile } from "./types/influencer-profile";
import { getSlug } from "./helpers/get-slug";
import { Filter, ObjectId } from "mongodb";

@Injectable()
export class InfluencerService {
  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(ApifyService) private apifyService: ApifyService
  ) {}

  async fetchInfluencers(params: { id?: string; name?: string }) {
    const { id, name } = params;
    const query: Filter<InfluencerProfile<ObjectId>> = {};
    if (id) {
      query._id = new ObjectId();
    } else if (name) {
      query.name = { $regex: name };
    }
    const influencers = await this.databaseService.db
      .collection<InfluencerProfile<ObjectId>>("influencers")
      .find(query)
      .toArray();
    return influencers;
  }

  async registerInfluencer(name: string) {
    const slug = getSlug(name);
    const influencerExists = await this.databaseService.db
      .collection<InfluencerProfile<ObjectId>>("influencers")
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
    const influencerProfile: InfluencerProfile<ObjectId> = {
      _id: inserResult.insertedId,
      ...influencerData,
    };
    return influencerProfile;
  }
}
