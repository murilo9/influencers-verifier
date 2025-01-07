import { Claim } from "@influencer-checker/api/src/types/claim";
import { ClaimStatus } from "../types/claim-status";

/**
 * Gets the status of a claim.
 * @param claim
 * @returns
 */
export const getClaimVerificationStatus = (
  claim: Claim<string>
): {
  label: ClaimStatus;
  color: "inherit" | "error" | "warning" | "success";
} => {
  if (claim.verificationStatus === "unverified") {
    return { label: "unverified", color: "inherit" };
  }
  if (claim.score === null) {
    return { label: "questionable-no-articles", color: "warning" };
  }
  // If claim is verified
  switch (true) {
    case claim.score < 0:
      return { label: "debunked", color: "error" };
    case claim.score < 0.6:
      return { label: "questionable-score", color: "warning" };
    default:
      return { label: "supported", color: "success" };
  }
};

export const getScoreStatus = (score: number | null) => {
  const scoreAsNumber = score as number;
  switch (true) {
    case score === null:
      return "inherit";
    case scoreAsNumber < 0:
      return "error";
    case scoreAsNumber < 0.6:
      return "warning";
    default:
      return "success";
  }
};
