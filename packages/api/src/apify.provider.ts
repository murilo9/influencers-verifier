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

  public async fetchPosts(
    influencerId: ObjectId,
    socialNetwork: "instagram" | "facebook"
  ) {
    const influencer = await this.databaseService.db
      .collection<Omit<InfluencerProfile<ObjectId>, "_id">>("influencers")
      .findOne({ _id: influencerId });
    if (!influencer) {
      throw new NotFoundException("Influencer not registered yet");
    }

    switch (socialNetwork) {
      case "facebook":
        // TODO:
        break;
      case "instagram":
        this.createPostFetchRunnerForInstagram(influencer, socialNetwork);
        break;
      default:
        throw new BadRequestException("Unknown social network");
    }
    return;
  }

  private async createPostFetchRunnerForInstagram(
    influencer: InfluencerProfile<ObjectId>,
    socialNetwork: "instagram" | "facebook"
  ) {
    const socialUrl = influencer.socialProfile[socialNetwork];
    // Shortcuts if influencerhas no profile for this social network
    if (!socialUrl) {
      throw new BadRequestException(
        "Influencer does not have account for the given social network"
      );
    }
    const profileName = getProfileNameFromSocialUrl(socialUrl);
    // Inserts the post fetch run in the database
    const insertResult = await this.databaseService.db
      .collection<Omit<PostFetchRunner, "_id">>("postFetchRunners")
      .insertOne({ influencerId: influencer._id, socialNetwork });
    const postFetchRunId = insertResult.insertedId;
    console.log("post fetch run created", postFetchRunId);
    // Prepares the Apify actor input
    const input = {
      username: [profileName],
      resultsLimit: 10,
    };
    // Initializes the Apify actor run, and let it running in background
    this.client
      .actor("nH2AHrwxeTRJoN5hX")
      .call(input)
      .then((run) => {
        console.log("Run done", run);
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
            // Emmits the 'posts.fetched' event
            const payload: PostsFetchedEventPayload = {
              posts,
              postFetchRunId,
            };
            this.eventEmitter.emit("posts.fetched", payload);
          });
      });
  }

  @OnEvent("posts.fetched")
  private async onPostsFetched(payload: PostsFetchedEventPayload) {
    console.log("posts fetched");
    console.log(payload);
    const { postFetchRunId, posts } = payload;
    // Remove the post fetch run from the database
    await this.databaseService.db
      .collection("postFetchRunners")
      .deleteOne({ _id: postFetchRunId });
    // Saves the posts in the database
    await this.databaseService.db
      .collection("influencerPosts")
      .insertMany(posts);
  }
}
