import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { DatabaseService } from "./database.provider";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongoClient } from "mongodb";
import { ApifyService } from "./apify.provider";
import { InfluencerService } from "./influencer.provider";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ClaimService } from "./claim.provider";
import { SentenceEncoderProvider } from "./sentence-encoder.provider";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import { ScientificArticleService } from "./scientific-article.provider";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
    }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    ApifyService,
    InfluencerService,
    ClaimService,
    ScientificArticleService,
    {
      provide: DatabaseService,
      useFactory: async (configService: ConfigService) => {
        // console.log('MONGODB_URI', MONGODB_URI);
        const MONGODB_URI = configService.get("MONGODB_URI");
        console.log("MONGODB_URI", MONGODB_URI);
        const client = new MongoClient(MONGODB_URI);
        try {
          console.log("connecting to database...");
          await client.connect();
          console.log("connected");
        } catch (error) {
          console.log(error);
        }
        return new DatabaseService(client);
      },
      inject: [ConfigService],
    },
    {
      provide: SentenceEncoderProvider,
      useFactory: async () => {
        const model = await use.load();
        return new SentenceEncoderProvider(model);
      },
    },
  ],
})
export class AppModule {}
