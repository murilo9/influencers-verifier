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
import { Filter, ObjectId, WithoutId } from "mongodb";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class InfluencerService {
  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(ApifyService) private apifyService: ApifyService,
    private eventEmitter: EventEmitter2
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

  /**
   * Registers an influencer and fetches their posts from social links.
   * @param name
   * @returns
   */
  async registerInfluencer(name: string) {
    const slug = getSlug(name);
    const influencerExists = await this.databaseService.db
      .collection<InfluencerProfile<ObjectId>>("influencers")
      .findOne({ slug });
    if (influencerExists) {
      throw new BadRequestException("Influencer is already registered");
    }
    // Fetches influencer's social profiles
    const influencerData: WithoutId<InfluencerProfile<ObjectId>> = {
      name,
      slug,
      socialProfile: {
        facebook: null,
        instagram: null,
        tiktok: null,
        twitter: null,
        youtube: null,
      },
      registration: {
        errors: [],
        lastUpdate: new Date().getTime(),
        status: "fetching_posts",
      },
    };

    // Inserts influencer's profile in the database
    const inserResult = await this.databaseService.db
      .collection("influencers")
      .insertOne(influencerData);
    const now = new Date();
    const influencerProfile: InfluencerProfile<ObjectId> = {
      _id: inserResult.insertedId,
      ...influencerData,
    };
    // Emmits the influencer_registered event to InfluencerService:fetchInfluencerSocialLinks
    this.eventEmitter.emit("influencer_registered", {
      influencer: influencerProfile,
    });
    return influencerProfile;
  }

  @OnEvent("influencer_registered")
  async fetchInfluencerSocialLinks({
    influencer,
  }: {
    influencer: InfluencerProfile<ObjectId>;
  }) {
    try {
      const socialProfiles = await this.apifyService.fetchInfluencer(
        influencer.name
      );
      // Attaches social profiles to influencer's profile
      socialProfiles.forEach(
        (socialProfile) =>
          (influencer.socialProfile[socialProfile.social] =
            socialProfile.socialProfileUrl)
      );
      this.databaseService.db
        .collection<InfluencerProfile<ObjectId>>("influencers")
        .updateOne(
          { _id: influencer._id },
          { $set: { socialProfile: influencer.socialProfile } }
        );
      // Emmits the social_profiles_fetched to ApifyService:fetchPosts
      this.eventEmitter.emit("social_profiles_fetched", { influencer });
    } catch (error) {
      console.log(error);
      // Saves the error message
      influencer.registration.errors.unshift({
        timestamp: new Date().getTime(),
        message: "Failed to fetch social links",
      });
      influencer.registration.status = "error";
      this.databaseService.db
        .collection<InfluencerProfile<ObjectId>>("influencers")
        .updateOne(
          { _id: influencer._id },
          { $set: { registration: influencer.registration } }
        );
    }
  }

  async deleteInfluencer(influencerId: ObjectId) {
    console.log(influencerId);
    await this.databaseService.db
      .collection<InfluencerProfile<ObjectId>>("influencers")
      .deleteMany({ _id: influencerId });
    return;
  }
}
