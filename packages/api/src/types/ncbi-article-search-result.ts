export type NCBIArticleSearchResult = {
  eSearchResult: {
    Count: string;
    RetMax: string;
    RetStart: string;
    IdList: {
      // This is what matters
      Id: string[];
    };
    TranslationSet: {
      Translation: {
        From: string;
        To: string;
      };
    };
    TranslationStack: {
      TermSet: Array<{
        Term: string;
        Field: string;
        Count: string;
        Explode: string;
      }>;
      OP: string[];
    };
    QueryTranslation: string;
  };
};
