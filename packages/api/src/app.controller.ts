import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { InfluencerService } from "./influencer.provider";
import { ObjectId } from "mongodb";
import { ClaimService } from "./claim.provider";
import { ApifyService } from "./apify.provider";
import { ArticleService } from "./article.provider";
import { IdentityGuard } from "./guards/identity.guard";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";
import { BadRequestError } from "openai";

@Controller("")
export class AppController {
  constructor(
    @Inject(InfluencerService) private influencerService: InfluencerService,
    @Inject(ClaimService) private claimService: ClaimService,
    @Inject(ApifyService) private apifyService: ApifyService,
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(ArticleService)
    private articleService: ArticleService
  ) {}

  // Validates the auhtorization access token
  @UseGuards(IdentityGuard)
  @Get("authorization")
  validateAuth() {
    return;
  }

  // Signs in to the admin panel (retrieves an access token)
  @Post("signin")
  signIn(@Body() body: { password: string }) {
    const actualAdminPassword = this.configService.get("ADMIN_PASSWORD");
    const jwtSecret = this.configService.get("JWT_SECRET");
    if (body.password !== actualAdminPassword) {
      throw new BadRequestException("Wrong password");
    }
    const accessToken = jwt.sign(
      {
        adminPassword: actualAdminPassword,
      },
      jwtSecret
    );
    return {
      accessToken,
    };
  }

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
  @UseGuards(IdentityGuard)
  @Post("influencers")
  registerInfluencer(@Body() body: { name: string }) {
    return this.influencerService.registerInfluencer(body.name);
  }

  // Verifies all unverified claims
  @UseGuards(IdentityGuard)
  @Post("verify-claims")
  verifyClaims() {
    return this.claimService.verifyClaimsSync();
  }

  @UseGuards(IdentityGuard)
  @Delete("influencers/:influencerId")
  deleteInfluencer(@Param("influencerId") influencerId: string) {
    return this.influencerService.deleteInfluencer(new ObjectId(influencerId));
  }

  @UseGuards(IdentityGuard)
  @Delete("claims/:claimId")
  deleteClaim(@Param("claimId") claimId: string) {
    return this.claimService.deleteClaim(new ObjectId(claimId));
  }

  @UseGuards(IdentityGuard)
  @Post("custom-claims")
  addCustomClaim(@Body() body: { text: string }) {
    this.claimService.addCustomClaim(body.text);
    return;
  }
}
