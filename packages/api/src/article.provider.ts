import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as xml2js from "xml2js";
import { NCBIArticleSearchResult } from "./types/ncbi-article-search-result";
import { Article } from "./types/article";
import {
  SillyAbstractText,
  NCBIArticleResult,
  AuthorData,
} from "./types/ncbi-article-result";

const buildSearchUrl = (search: string, source: "ncbi") => {
  switch (source) {
    case "ncbi":
      return `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${search}`;
    default:
      return "";
  }
};

const buildArticleRetrieveUrl = (ids: Array<string>, source: "ncbi") => {
  switch (source) {
    case "ncbi":
      return `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(
        ","
      )}`;
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
      if (!ncbiResponse.eSearchResult.IdList) {
        return [];
      }
      console.log("parseSearchResult:ncbiResponse", ncbiResponse);
      const idList = ncbiResponse.eSearchResult.IdList.Id;
      return typeof idList === "string" ? [idList] : idList;
    default:
      return [];
  }
};

/**
 * Parses an articles list fetch result in a list of articles.
 */
const parseArticleResult = (
  response: unknown,
  source: "ncbi"
): Array<Article> => {
  switch (source) {
    case "ncbi":
      const ncbiResponse = response as NCBIArticleResult;
      console.log("parseArticleResult:ncbiResponse", ncbiResponse);
      const articlesData = ncbiResponse.PubmedArticleSet.PubmedArticle;
      const articles: Array<Article> = [];
      articlesData.forEach((item) => {
        try {
          const articleData = item.MedlineCitation;
          // Shortcuts if article has no abstract text (as it is likely invalid)
          if (!articleData.Article.Abstract) {
            return;
          }
          const { AbstractText } = articleData.Article.Abstract;
          // Sometimes the abstract text can come in a silly array format rather than a string
          const abstract =
            typeof AbstractText === "string"
              ? AbstractText
              : (articleData.Article.Abstract.AbstractText as SillyAbstractText)
                  .map((abstract) => abstract._)
                  .join(" ");
          const authorsData = articleData.Article.AuthorList.Author;
          const authorsList = (authorsData as Array<AuthorData>).length
            ? (authorsData as Array<AuthorData>)
            : [authorsData as AuthorData];
          const authors = authorsList.map(
            (author) => `${author.ForeName} ${author.LastName}`
          );
          const article = {
            id: articleData.PMID._,
            abstract,
            authors,
            source,
            title: articleData.Article.ArticleTitle,
            url: buildArticleDisplayUrl(articleData.PMID._, source),
          };
          articles.push(article);
        } catch (error) {
          console.log(
            "For some freakin' reason, could not parse this freakin' article. Skipping it."
          );
        }
      });
      return articles;
    default:
      return [];
  }
};

@Injectable()
export class ArticleService {
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
    const articlesIds = parseSearchResult(jsonResponse, source);
    return articlesIds;
  }

  async fetchArticlesByIds(
    ids: string[],
    source: "ncbi"
  ): Promise<Array<Article>> {
    const url = buildArticleRetrieveUrl(ids, source);
    const response = await axios.get(url);
    const xmlResponse = response.data;
    const jsonResponse = await xml2js.parseStringPromise(xmlResponse, {
      explicitArray: false,
    });
    const articles = parseArticleResult(jsonResponse, source);
    return articles;
  }
}
