import { Injectable } from "@nestjs/common";
import { Db, MongoClient } from "mongodb";

@Injectable()
export class DatabaseService {
  public readonly db: Db;

  constructor(client: MongoClient) {
    this.db = client.db();
  }
}
