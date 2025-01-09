import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import "@tensorflow/tfjs-node";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  console.log("PORT", process.env.PORT);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
