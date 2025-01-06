import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { InfluencerService } from "./influencer.provider";
import { ObjectId } from "mongodb";
import { ClaimService } from "./claim.provider";
import { ApifyService } from "./apify.provider";
import { ArticleService } from "./article.provider";

@Controller("")
export class AppController {
  constructor(
    @Inject(InfluencerService) private influencerService: InfluencerService,
    @Inject(ClaimService) private claimService: ClaimService,
    @Inject(ApifyService) private apifyService: ApifyService,
    @Inject(ArticleService)
    private articleService: ArticleService
  ) {}

  // Retrieves claims
  @Get("claims")
  getClaims(@Query() query: { text?: string; categories?: string }) {
    return this.claimService.fetchClaims(query);
  }

  // Retrieves influencers
  @Get("influencers")
  getInfluencer(@Query() query: { name?: string; id?: string }) {
    return this.influencerService.fetchInfluencers(query);
  }

  // Registers a new influencer
  @Post("influencers")
  registerInfluencer(@Body() body: { name: string }) {
    return this.influencerService.registerInfluencer(body.name);
  }

  // Fetch posts in a social profile for a specific influencer
  @Post("fetch-posts")
  fetchPosts(
    @Body()
    body: {
      influencerId: string;
      socialNetwork: "instagram" | "facebook";
    }
  ) {
    return this.apifyService.fetchPosts(
      new ObjectId(body.influencerId),
      body.socialNetwork
    );
  }

  // Extract claims from influencers' posts
  @Post("processate-posts")
  processatePosts(
    @Body()
    body: {
      influencerId: string;
    }
  ) {
    return this.claimService.processateInfluencerPosts(
      new ObjectId(body.influencerId)
    );
  }

  // Search for articles in a medical database
  @Get("search-articles")
  searchArticles(@Query() query: { search: string }) {
    return this.articleService.searchArticles(query.search, "ncbi");
  }

  // Retrieves a specific article in a medical database, by ID
  @Get("retrieve-articles")
  getArticle(@Query() query: { ids: string; source: "ncbi" }) {
    return this.articleService.fetchArticlesByIds(
      query.ids.split(","),
      query.source
    );
  }

  // Verifies all unverified claims
  @Post("verify-claims")
  verifyClaims() {
    return this.claimService.verifyClaimsSync();
  }
}
