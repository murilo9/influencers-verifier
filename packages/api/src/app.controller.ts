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
import { ScientificArticleService } from "./scientific-article.provider";

@Controller("")
export class AppController {
  constructor(
    @Inject(InfluencerService) private influencerService: InfluencerService,
    @Inject(ClaimService) private claimService: ClaimService,
    @Inject(ApifyService) private apifyService: ApifyService,
    @Inject(ScientificArticleService)
    private scientificArticleService: ScientificArticleService
  ) {}

  @Get("test")
  test() {
    return "API Works!";
  }

  @Get("influencer")
  getInfluencer(@Query() body: { name: string }) {
    return this.influencerService.influencerLookup(body.name);
  }

  @Post("influencer")
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
    return this.scientificArticleService.searchArticles(query.search, "ncbi");
  }

  @Get("article/:id")
  getArticle(@Param("id") id: string, @Query() query: { source: "ncbi" }) {
    return this.scientificArticleService.fetchArticlesByIds([id], query.source);
  }
}
