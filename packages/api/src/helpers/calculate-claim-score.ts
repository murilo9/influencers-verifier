import { ClaimElements } from "src/types/claim-elements";
import { ArticleVerificationResult } from "src/types/claim-verification-by-articles-payload";

const STRENGTH = {
  mild: 0.5,
  strong: 1,
};

/**
 * Calculates the mode of an array of number (thank you, ChatGPT).
 */
function calculateMode(arr: number[]) {
  if (arr.length === 0) {
    return 0; // Default overall score when the array is empty
  }

  const frequencyMap = {};
  let maxFrequency = 0;
  let mode = arr[0]; // Initialize mode to the first score

  arr.forEach((score) => {
    frequencyMap[score] = (frequencyMap[score] || 0) + 1;

    if (frequencyMap[score] > maxFrequency) {
      maxFrequency = frequencyMap[score];
      mode = score;
    }
  });

  return mode;
}

function computeScore(score: number, articlesAmount: number) {
  const alpha = 0.1; // Amplification factor for x > 0

  if (score <= 0) {
    return score; // No attenuation for x <= 0
  }

  // Compute amplified value for x > 0
  const amplifiedValue = score * (1 + alpha * Math.log(1 + articlesAmount));

  // Ensure the result does not exceed 1
  return Math.min(1, amplifiedValue);
}

export const calculateClaimScore = (
  results: Array<ArticleVerificationResult>
): number | null => {
  const scoreList: Array<number> = [];
  results.forEach((result) => {
    // Shortcuts if article is unrelated
    if (result.direction === "unrelated") {
      return;
    }
    // Attach score according to direction and strenght
    switch (result.direction) {
      case "support":
        scoreList.push(STRENGTH[result.strength]);
        break;
      case "contradict":
        scoreList.push(-STRENGTH[result.strength]);
        break;
      default:
        scoreList.push(0);
    }
  });
  if (scoreList.length) {
    console.log("scoreList", scoreList);
    const scoreAverage =
      scoreList.reduce((acc, value) => acc + value, 0) / scoreList.length;
    console.log("scoreAverage", scoreAverage);
    return scoreAverage;
  } else {
    return null;
  }
};
