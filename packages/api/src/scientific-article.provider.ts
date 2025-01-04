import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as xml2js from "xml2js";
import { NCBIArticleSearchResult } from "./types/ncbi-article-search-result";
import { Article } from "./types/article";
import { NCBIArticleResult } from "./types/ncbi-article-result";

const buildSearchUrl = (search: string, source: "ncbi") => {
  switch (source) {
    case "ncbi":
      return `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${search}`;
    default:
      return "";
  }
};

const buildArticleRetrieveUrl = (id: string, source: "ncbi") => {
  switch (source) {
    case "ncbi":
      return `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${id}`;
    default:
      return "";
  }
};

const buildArticleDisplayUrl = (id: string, source: "ncbi") => {
  switch (source) {
    case "ncbi":
      return `https://pubmed.ncbi.nlm.nih.gov/${id}`;
    default:
      return "";
  }
};

/**
 * Parses a search result and returns a list of article IDs.
 * @param response request response data (json object)
 * @param source provider source
 */
const parseSearchResult = (
  response: unknown,
  source: "ncbi"
): Array<string> => {
  switch (source) {
    case "ncbi":
      const ncbiResponse = response as NCBIArticleSearchResult;
      return ncbiResponse.eSearchResult.IdList.Id;
    default:
      return [];
  }
};

const parseArticleResult = (
  response: unknown,
  source: "ncbi"
): Article | null => {
  switch (source) {
    case "ncbi":
      const ncbiResponse = response as NCBIArticleResult;
      const articleData =
        ncbiResponse.PubmedArticleSet.PubmedArticle.MedlineCitation;
      const abstract = articleData.Article.Abstract.AbstractText.map(
        (abstract) => abstract._
      ).join(" ");
      const authors = articleData.Article.AuthorList.Author.map(
        (author) => `${author.ForeName} ${author.LastName}`
      );
      return {
        abstract,
        authors,
        source,
        title: articleData.Article.ArticleTitle,
        url: buildArticleDisplayUrl(articleData.PMID._, source),
      };
    default:
      return null;
  }
};

@Injectable()
export class ScientificArticleService {
  async searchArticles(search: string, source: "ncbi"): Promise<Array<string>> {
    if (!search) {
      return [];
    }
    const url = buildSearchUrl(search, source);
    const request = await axios.get(url);
    const xmlResponse = request.data as string;
    const jsonResponse = await xml2js.parseStringPromise(xmlResponse, {
      explicitArray: false,
    });
    console.log(jsonResponse);
    const articlesIds = parseSearchResult(jsonResponse, source);
    return articlesIds;
  }

  async fetchArticlesByIds(ids: string[], source: "ncbi") {
    let articles: Array<Article> = [];
    for (const id of ids) {
      const url = buildArticleRetrieveUrl(id, source);
      const request = await axios.get(url);
      const xmlResponse = request.data as string;
      const jsonResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      const article = parseArticleResult(jsonResponse, source);
      if (article) {
        articles.push(article);
      }
    }
    return articles;
  }
}
