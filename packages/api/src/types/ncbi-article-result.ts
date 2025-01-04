export type NCBIArticleResult = {
  PubmedArticleSet: {
    PubmedArticle: {
      MedlineCitation: {
        $: {
          Status: string;
          Owner: string;
        };
        PMID: {
          _: string;
          $: {
            Version: string;
          };
        };
        DateCompleted: {
          Year: string;
          Month: string;
          Day: string;
        };
        DateRevised: {
          Year: string;
          Month: string;
          Day: string;
        };
        Article: {
          $: {
            PubModel: string;
          };
          Journal: {
            ISSN: {
              _: string;
              $: {
                IssnType: string;
              };
            };
            JournalIssue: {
              $: {
                CitedMedium: string;
              };
              Volume: string;
              Issue: string;
              PubDate: {
                Year: string;
                Month: string;
              };
            };
            Title: string;
            ISOAbbreviation: string;
          };
          ArticleTitle: string;
          Pagination: {
            StartPage: string;
            EndPage: string;
            MedlinePgn: string;
          };
          Abstract: {
            AbstractText: Array<{
              _: string; // Pick this
              $: {
                Label: string;
                NlmCategory: string;
              };
            }>;
          };
          AuthorList: {
            $: {
              CompleteYN: string;
            };
            Author: Array<{
              $: {
                ValidYN: string;
              };
              LastName: string;
              ForeName: string;
              Initials: string;
              AffiliationInfo: {
                Affiliation: string;
              };
            }>;
          };
          Language: string;
          PublicationTypeList: {
            PublicationType: {
              _: string;
              $: {
                UI: string;
              };
            };
          };
        };
        MedlineJournalInfo: {
          Country: string;
          MedlineTA: string;
          NlmUniqueID: string;
          ISSNLinking: string;
        };
        ChemicalList: {
          Chemical: {
            RegistryNumber: string;
            NameOfSubstance: {
              _: string;
              $: {
                UI: string;
              };
            };
          };
        };
        CitationSubset: string;
        MeshHeadingList: {
          MeshHeading: Array<{
            DescriptorName: {
              _: string;
              $: {
                UI: string;
                MajorTopicYN: string;
              };
            };
          }>;
        };
        ReferenceList: {
          Reference: Array<{
            Citation: string;
            ArticleIdList: {
              ArticleId: {
                _: string;
                $: {
                  IdType: string;
                };
              };
            };
          }>;
        };
      };
    };
  };
};
