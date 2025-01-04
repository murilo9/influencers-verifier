import { Body, Controller, Get, Inject, Post, Query } from "@nestjs/common";
import { InfluencerService } from "./influencer.provider";
import { ObjectId } from "mongodb";
import { ClaimService } from "./claim.provider";
import { ApifyService } from "./apify.provider";

@Controller("")
export class AppController {
  constructor(
    @Inject(InfluencerService) private influencerService: InfluencerService,
    @Inject(ClaimService) private claimService: ClaimService,
    @Inject(ApifyService) private apifyService: ApifyService
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
}
