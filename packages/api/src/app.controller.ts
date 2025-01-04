import { Body, Controller, Get, Inject, Post, Query } from "@nestjs/common";
import { InfluencerService } from "./influencer.provider";
import { ObjectId } from "mongodb";

@Controller("")
export class AppController {
  constructor(
    @Inject(InfluencerService) private influencerService: InfluencerService
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

  @Post("fetch-claims")
  fetchClaims(
    @Body()
    body: {
      influencerId: string;
      socialNetwork: "instagram" | "facebook";
    }
  ) {
    return this.influencerService.fetchClaims(
      new ObjectId(body.influencerId),
      body.socialNetwork
    );
  }
}
