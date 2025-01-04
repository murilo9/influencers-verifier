import { Injectable } from "@nestjs/common";
import * as use from "@tensorflow-models/universal-sentence-encoder";

@Injectable()
export class SentenceEncoderProvider {
  constructor(public model: use.UniversalSentenceEncoder) {}
}
