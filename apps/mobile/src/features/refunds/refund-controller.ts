import type { RefundDecision } from "../../services/buyer-api";

export type RefundStatusView = {
  headline: string;
  detail: string;
  tone: "neutral" | "success" | "warning";
};

export type RefundController = {
  describeDecision: (decision?: RefundDecision) => RefundStatusView;
};

export function createRefundController(): RefundController {
  return {
    describeDecision(decision) {
      if (!decision) {
        return {
          headline: "Store credit default",
          detail: "No refund decision yet. If a refund is approved, store credit is the default unless admin moves it to source payment.",
          tone: "neutral",
        };
      }

      if (decision.decisionType === "payment_source") {
        return {
          headline: "Payment source exception",
          detail: `${decision.status.replace("_", " ")}${decision.reasonCode ? ` · ${decision.reasonCode}` : ""}`,
          tone: "warning",
        };
      }

      return {
        headline: "Store credit refund",
        detail: `${decision.status.replace("_", " ")}${decision.reasonCode ? ` · ${decision.reasonCode}` : ""}`,
        tone: decision.status === "approved" ? "success" : "neutral",
      };
    },
  };
}
