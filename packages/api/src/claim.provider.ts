import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import * as crypto from "crypto";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import { DatabaseService } from "./database.provider";
import { Filter, ObjectId, WithoutId } from "mongodb";
import { InfluencerProfile } from "./types/influencer-profile";
import { InfluencerPost } from "./types/influencer-post";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import OpenAI, { InternalServerError } from "openai";
import { ConfigService } from "@nestjs/config";
import { getClaimExtractionPrompt } from "./helpers/get-claim-extraction-prompt";
import { Claim } from "./types/claim";
import { SentenceEncoderProvider } from "./sentence-encoder.provider";
import { getArticleSearchQueryPrompt } from "./helpers/get-article-search-query-prompt";
import { ArticleService } from "./article.provider";
import { ClaimElements } from "./types/claim-elements";
import { mountArticleSearchQueries } from "./helpers/mount-article-search-queries";
import { Article } from "./types/article";
import { getClaimVerificationPrompt } from "./helpers/get-claim-verification-prompt";
import { wait } from "./helpers/wait";
import { ClaimVerificationByArticlesPayload } from "./types/claim-verification-by-articles-payload";
import { calculateClaimScore } from "./helpers/calculate-claim-score";

const secondsToWait = 4;

type PrebuiltClaim = {
  influencerId: string;
  claim: string;
  originalText: string;
  postUrl: string;
  categories: Array<string>;
};

type ChatGPTClaimsExtractedPayload = {
  claims: Array<PrebuiltClaim>;
};

type ArticleSearchQueryExtracetdPayload = {
  elements: Array<
    ClaimElements & {
      claimId: string;
    }
  >;
};

@Injectable()
export class ClaimService {
  private openAi: OpenAI;

  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(ConfigService) configService: ConfigService,
    @Inject(ArticleService) private articleService: ArticleService,
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
    existingClaims: Array<Claim<ObjectId>>
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
  @OnEvent("posts_saved")
  private async extractClaimsFromPosts({
    posts,
    influencer,
  }: {
    posts: Array<InfluencerPost<ObjectId>>;
    influencer: InfluencerProfile<ObjectId>;
  }): Promise<void> {
    console.log("extracting claims begin");
    // Updates the influencer profile' registration status
    influencer.registration.status = "extracting_claims";
    influencer.registration.lastUpdate = new Date().getTime();
    await this.databaseService.db
      .collection<InfluencerProfile<ObjectId>>("influencers")
      .updateOne(
        { _id: influencer._id },
        { $set: { registration: influencer.registration } }
      );
    // Starts the claims extraction proccess
    try {
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
      ) as ChatGPTClaimsExtractedPayload;
      // Converts all claims' text to lowercase
      const prebuiltClaims = payload.claims.map((claim) => ({
        ...claim,
        claim: claim.claim.toLowerCase(),
      }));
      // Emmits the claims_extracted event to CLaimService:onClaimsExtracted
      this.eventEmitter.emit("claims_extracted", {
        prebuiltClaims,
        influencer,
      });
    } catch (error) {
      console.log(error);
      // Saves the error message
      influencer.registration.errors.unshift({
        timestamp: new Date().getTime(),
        message: "Failed to extract claims from posts",
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

  @OnEvent("claims_extracted")
  private async sourceInfluencerToClaims({
    influencer,
    prebuiltClaims,
  }: {
    prebuiltClaims: Array<PrebuiltClaim>;
    influencer: InfluencerProfile<ObjectId>;
  }) {
    console.log("sourceInfluencerToClaims begin");
    // Starts the claims verification process
    const existingClaims: Array<Claim<ObjectId>> = await this.databaseService.db
      .collection<Claim<ObjectId>>("claims")
      .find()
      .toArray();
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
        .collection<Claim<ObjectId>>("claims")
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
        .collection<WithoutId<Claim<ObjectId>>>("claims")
        .updateOne(
          { _id: claimToUpdate._id },
          { $set: { sources: claimToUpdate.sources } }
        );
      console.log("a claim source was updated");
    }
    // Updates the influencer profile' registration status
    influencer.registration.status = "verifying_claims";
    influencer.registration.lastUpdate = new Date().getTime();
    await this.databaseService.db
      .collection<InfluencerProfile<ObjectId>>("influencers")
      .updateOne(
        { _id: influencer._id },
        { $set: { registration: influencer.registration } }
      );
    // Emmits the verify_claims event to ClaimProvider:verifyClaims
    this.eventEmitter.emit("verify_claims", { influencer });
  }

  async fetchClaims(params: { text?: string; categories?: string }) {
    const { text, categories } = params;
    const query: Filter<Claim<ObjectId>> = {};
    if (text) {
      query.normalizedClaim = {
        $regex: new RegExp(text.split("+").join("|"), "gim"),
      };
    }
    if (categories) {
      query.categories = {
        $all: categories
          ?.split(",")
          .map((category) => category.split("+").join(" ")),
      };
    }
    const claims = await this.databaseService.db
      .collection<WithoutId<Claim<ObjectId>>>("claims")
      .find(query)
      .toArray();
    return claims;
  }

  /**
   * A dedicated function to save claims in the database.
   */
  public async addClaims(prebuiltClaims: Array<PrebuiltClaim>): Promise<void> {
    for (const prebuiltClaim of prebuiltClaims) {
      const claimDto: WithoutId<Claim<ObjectId>> = {
        normalizedClaim: prebuiltClaim.claim,
        verificationStatus: "unverified",
        categories: prebuiltClaim.categories,
        sources: {},
        score: null,
        articlesFound: 0,
      };
      await this.databaseService.db
        .collection<WithoutId<Claim<ObjectId>>>("claims")
        .insertOne(claimDto);
      console.log("a claim was added");
    }
  }

  /**
   * Verificates a single claim and sets its scored based on the given articles.
   * @param claim
   * @param articles
   */
  private async verifySingleClaim(
    claim: Claim<ObjectId>,
    articles: Array<Article>
  ) {
    let claimScore: number | null = null;
    if (articles.length) {
      const prompt = getClaimVerificationPrompt(claim, articles);
      console.log("verifying claim: ", claim);
      console.log("asking to ChatGPT verificate claim based on articles...");
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
      ) as ClaimVerificationByArticlesPayload;
      const { results } = payload;
      console.log("articles analysis results from ChatGPT:", results);
      claimScore = calculateClaimScore(results);
      console.log("claim score: ", claimScore);
    }
    await this.databaseService.db
      .collection<Claim<ObjectId>>("claims")
      .updateOne(
        { _id: claim._id },
        {
          $set: {
            score: claimScore,
            verificationStatus: "verified",
            articlesFound: articles.length,
          },
        }
      );
    console.log("Verification finished for this claim");
  }

  /**
   * Verifies all unverified claims.
   */
  @OnEvent("verify_claims")
  private async verifyClaims({
    influencer,
  }: {
    influencer?: InfluencerProfile<ObjectId>;
  }) {
    console.log("verifyClaims begin");
    const unverifiedClaims = await this.databaseService.db
      .collection<Claim<ObjectId>>("claims")
      .find({ verificationStatus: "unverified" })
      .toArray();
    const unverifiedClaimsStore = unverifiedClaims.reduce(
      (store, claim) => ({ ...store, [claim._id.toString()]: claim }),
      {} as Record<string, Claim<ObjectId>>
    );
    try {
      const prompt = getArticleSearchQueryPrompt(unverifiedClaims);
      console.log("asking claims elements to ChatGPT...");
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
      ) as ArticleSearchQueryExtracetdPayload;
      // Fetches the articles for each claim
      for (const claimElements of payload.elements) {
        const claim = unverifiedClaimsStore[claimElements.claimId];
        const searchQueries = mountArticleSearchQueries(claimElements);
        const articleIdsFound: Record<string, string> = {};
        for (const query of searchQueries) {
          console.log("->query:", query);
          console.log("searching for articles...");
          const relatedArticlesIds = await this.articleService.searchArticles(
            query,
            "ncbi"
          );
          console.log(
            relatedArticlesIds.length + " articles found for this query"
          );
          relatedArticlesIds.forEach((id) => (articleIdsFound[id] = id));
          console.log(`Waiting ${secondsToWait} seconds...`);
          await wait(secondsToWait);
        }
        const articleIdsFoundList = Object.values(articleIdsFound);
        let articles: Array<Article> = [];
        // Shortcuts if no articles have been found for this query
        if (articleIdsFoundList.length) {
          console.log(
            articleIdsFoundList.length +
              " articles found for this claim in total"
          );
          // Batch fetches the actual articles found
          articles = await this.articleService.fetchArticlesByIds(
            articleIdsFoundList.slice(0, 8), // Temporarily limited to 8 articles
            "ncbi"
          );
        } else {
          console.log("No articles found for this claim");
        }
        await this.verifySingleClaim(claim, articles);
        console.log(`Waiting ${secondsToWait} seconds...`);
        await wait(secondsToWait);
      }
      // Updates the influencer's registration status
      if (influencer) {
        influencer.registration.status = "done";
        this.databaseService.db
          .collection<InfluencerProfile<ObjectId>>("influencers")
          .updateOne(
            { _id: influencer._id },
            { $set: { registration: influencer.registration } }
          );
      }
      console.log("------------------------- END -------------------------");
      return;
    } catch (error) {
      console.log(error);
      // Saves the error message
      if (influencer) {
        influencer.registration.errors.unshift({
          timestamp: new Date().getTime(),
          message: "Failed to verify claims",
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
  }

  public verifyClaimsSync() {
    this.eventEmitter.emit("verify_claims", {});
    return;
  }

  public async addCustomClaim(text: string) {
    console.log("addCustomClaim begin");
    const posts: Array<InfluencerPost<ObjectId>> = [
      {
        _id: new ObjectId(),
        content: text,
        influencerId: new ObjectId(),
        localId: "",
        socialNetwork: "instagram",
        url: "",
      },
    ];
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
    ) as ChatGPTClaimsExtractedPayload;
    // Converts all claims' text to lowercase
    const prebuiltClaims = payload.claims.map((claim) => ({
      ...claim,
      claim: claim.claim.toLowerCase(),
    }));
    const existingClaims: Array<Claim<ObjectId>> = await this.databaseService.db
      .collection<Claim<ObjectId>>("claims")
      .find()
      .toArray();
    // Removes duplicated prebuilt claims
    const filteredPrebuiltClaims = await this.getDuplicatedClaims(
      prebuiltClaims,
      existingClaims
    );
    // Saves the claims in the database
    await this.addClaims(filteredPrebuiltClaims);
    // Emmits the event to verify the new claims
    this.eventEmitter.emit("verify_claims", {});
  }

  public async deleteClaim(claimId: ObjectId) {
    await this.databaseService.db
      .collection<Claim<ObjectId>>("claims")
      .deleteOne({ _id: claimId });
    return;
  }
}
