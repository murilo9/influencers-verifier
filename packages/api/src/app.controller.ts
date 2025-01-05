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

  @Get("claims")
  getClaims(@Query() query: { text?: string; categories?: string }) {
    return this.claimService.fetchClaims(query);
  }

  @Get("influencers")
  getInfluencer(@Query() query: { name?: string; id?: string }) {
    return this.influencerService.fetchInfluencers(query);
  }

  @Post("influencers")
  registerInfluencer(@Body() query: { name: string }) {
    return this.influencerService.registerInfluencer(query.name);
  }

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

  @Get("search-articles")
  searchArticles(@Query() query: { search: string }) {
    return this.articleService.searchArticles(query.search, "ncbi");
  }

  @Get("retrieve-articles")
  getArticle(@Query() query: { ids: string; source: "ncbi" }) {
    return this.articleService.fetchArticlesByIds(
      query.ids.split(","),
      query.source
    );
  }

  @Post("verify-claims")
  verifyClaims() {
    return this.claimService.verifyClaimsSync();
  }
}
