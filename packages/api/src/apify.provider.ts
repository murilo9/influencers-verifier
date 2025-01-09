import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ApifyClient } from "apify-client";
import { InfluencerProfile } from "./types/influencer-profile";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { getProfileNameFromSocialUrl } from "./helpers/get-profile-name-from-url";
import { DatabaseService } from "./database.provider";
import { PostFetchRunner } from "./types/post-fetch-runner";
import { ObjectId } from "mongodb";
import { InfluencerPost } from "./types/influencer-post";

type PostsFetchedEventPayload = {
  posts: Array<Omit<InfluencerPost<ObjectId>, "_id">>;
  postFetchRunId: ObjectId;
};

@Injectable()
export class ApifyService {
  private client: ApifyClient;

  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    private eventEmitter: EventEmitter2
  ) {
    this.client = new ApifyClient({
      token: "apify_api_avwA2537Piy4ZACHfE8KrecmyQ4GcE2d42GA",
    });
  }

  public async fetchInfluencer(name: string) {
    const input = {
      profileNames: [name],
      socials: ["facebook", "instagram", "linkedin", "tiktok", "youtube"],
    };
    console.log("Run starting...");
    const run = await this.client.actor("H2ZIBUsxwkvDbXzqG").call(input);
    console.log("Run finished. Starting items listing...");
    const { items } = await this.client
      .dataset(run.defaultDatasetId)
      .listItems();
    console.log("fetchInfluencers:items", items);
    return items as Array<{ social: string; socialProfileUrl: string }>;
  }

  @OnEvent("social_profiles_fetched")
  public async fetchPosts({
    influencer,
  }: {
    influencer: InfluencerProfile<ObjectId>;
  }) {
    // Fow now, only instagram posts can be fetched
    this.createPostFetchRunnerForInstagram(influencer);
  }

  private async createPostFetchRunnerForInstagram(
    influencer: InfluencerProfile<ObjectId>
  ) {
    console.log("createPostFetchRunnerForInstagram init");
    const socialNetwork = "instagram";
    const socialUrl = influencer.socialProfile[socialNetwork];
    // Shortcuts if influencerhas no profile for this social network
    if (!socialUrl) {
      throw new BadRequestException(
        "Influencer does not have account for the given social network"
      );
    }
    const profileName = getProfileNameFromSocialUrl(socialUrl);
    // Prepares the Apify actor input
    const input = {
      username: [profileName],
      resultsLimit: 10,
    };
    // Initializes the Apify actor run, and let it running in background
    console.log("fetching posts... (this can take several seconds)");
    this.client
      .actor("nH2AHrwxeTRJoN5hX")
      .call(input)
      .then((run) => {
        console.log("Run done");
        this.client
          .dataset(run.defaultDatasetId)
          .listItems()
          .then((result) => {
            const { items } = result;
            const posts: Array<Omit<InfluencerPost<ObjectId>, "_id">> =
              items.map(
                // This part is different for every social network
                (item) => ({
                  content: (item.caption || "") as string,
                  localId: item.id as string,
                  socialNetwork: "instagram",
                  url: item.url as string,
                  influencerId: influencer._id,
                })
              );
            // Emmits posts_fetched event to ApifyService:onPostsFetched
            this.eventEmitter.emit("posts_fetched", { posts, influencer });
          });
      })
      // In case the posts fetching fails
      .catch((error) => {
        console.log(error);
        // Saves the error message
        influencer.registration.errors.unshift({
          timestamp: new Date().getTime(),
          message: "Failed to fetch posts from Instagram",
        });
        influencer.registration.status = "error";
        this.databaseService.db
          .collection<InfluencerProfile<ObjectId>>("influencers")
          .updateOne(
            { _id: influencer._id },
            { $set: { registration: influencer.registration } }
          );
      });
  }

  @OnEvent("posts_fetched")
  private async onPostsFetched({
    posts,
    influencer,
  }: {
    posts: Array<InfluencerPost<ObjectId>>;
    influencer: InfluencerProfile<ObjectId>;
  }) {
    console.log(posts.length, " posts fetched");
    // Saves the posts in the database
    await this.databaseService.db
      .collection("influencerPosts")
      .insertMany(posts);
    // Emmits the posts_saved event to ClaimService:extractClaimsFromPosts
    this.eventEmitter.emit("posts_saved", { posts, influencer });
  }
}
