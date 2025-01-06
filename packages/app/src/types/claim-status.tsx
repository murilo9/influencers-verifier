import {
  HourglassEmpty,
  QuestionMark,
  ThumbDownOutlined,
  ThumbUpOutlined,
} from "@mui/icons-material";
import { ReactNode } from "react";

export const CLAIM_STATUS_DESCRIPTION: Record<ClaimStatus, string> = {
  "questionable-no-articles":
    "We did not find any articles negating or supporting this claim.",
  "questionable-score":
    "Some articles support this claim, while others negate it or are inconclusive.",
  debunked: "Most or all articles found negate this claim.",
  supported: "Most or all articles found support this claim.",
  unverified: "We haven't validated this claim against scientific sources yet.",
};

export const CLAIM_STATUS_TITLE: Record<ClaimStatus, string> = {
  "questionable-no-articles": "Questionable: No articles",
  debunked: "Debunked",
  "questionable-score": "Questionable: Inconclusive",
  supported: "Supported",
  unverified: "Unverified",
};

const iconSx = { fontSize: "20px" };

export const CLAIM_STATUS_ICON: Record<ClaimStatus, ReactNode> = {
  "questionable-no-articles": <QuestionMark color="inherit" sx={iconSx} />,
  "questionable-score": <QuestionMark sx={iconSx} color="warning" />,
  debunked: <ThumbDownOutlined sx={iconSx} color="error" />,
  supported: <ThumbUpOutlined sx={iconSx} color="success" />,
  unverified: <HourglassEmpty sx={{ ...iconSx, color: "#444444" }} />,
};

export const CLAIM_STATUS_COLOR: Record<ClaimStatus, string> = {
  "questionable-no-articles": "inherit",
  "questionable-score": "warning",
  debunked: "error",
  supported: "success",
  unverified: "inherit",
};

export type ClaimStatus =
  | "unverified"
  | "questionable-no-articles"
  | "questionable-score"
  | "debunked"
  | "supported";
