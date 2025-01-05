import { ClaimElements } from "src/types/claim-elements";

/**
 * Mounts a properly formatted search queries based on a claim's elements.
 * @param elements Claim's elements
 * @returns
 */
export const mountArticleSearchQueries = (
  elements: ClaimElements
): Array<string> => {
  const queries: Array<string> = [];
  for (const subject of elements.subject) {
    for (const target of elements.target) {
      let queryList = [
        subject.split(" ").join("+") + "[title]",
        target.split(" ").join("+") + "[title]",
      ];
      queries.push(`human[orgn]+AND+${queryList.join("+AND+")}`);
    }
  }
  return queries;
};
