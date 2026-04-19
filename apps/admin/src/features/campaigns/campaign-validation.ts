export type CampaignLanguage = "english" | "hindi" | "hinglish";

export type CampaignType =
  | "new_arrival"
  | "trending"
  | "back_in_stock"
  | "price_drop";

export type CampaignMessageVariant = {
  language: string;
  title: string;
  body: string;
};

export type CampaignDraft = {
  campaignType: string;
  productIds: string[];
  messageVariants: CampaignMessageVariant[];
};

export type CampaignValidationResult = {
  valid: boolean;
  errors: string[];
};

const SUPPORTED_CAMPAIGN_TYPES = new Set<string>([
  "new_arrival",
  "trending",
  "back_in_stock",
  "price_drop",
]);

const SUPPORTED_LANGUAGES = new Set<string>(["english", "hindi", "hinglish"]);

const MIN_TITLE_LENGTH = 8;
const MIN_BODY_LENGTH = 24;

export function validateCampaignDraft(
  draft: CampaignDraft,
): CampaignValidationResult {
  const errors: string[] = [];
  const campaignType = draft.campaignType.trim();

  if (!SUPPORTED_CAMPAIGN_TYPES.has(campaignType)) {
    errors.push(
      "Choose a conversion-oriented campaign type: new arrival, trending, back in stock, or price drop.",
    );
  }

  if (draft.productIds.length === 0) {
    errors.push("Attach at least one product so the campaign has clear buying context.");
  }

  if (draft.messageVariants.length === 0) {
    errors.push("Add localized campaign copy before sending.");
  }

  const seenLanguages = new Set<string>();
  for (const variant of draft.messageVariants) {
    const language = variant.language.trim();
    const title = variant.title.trim();
    const body = variant.body.trim();

    if (!SUPPORTED_LANGUAGES.has(language)) {
      errors.push(`Unsupported language: ${language || "blank"}.`);
      continue;
    }

    if (seenLanguages.has(language)) {
      errors.push(`Only one message variant is allowed for ${language}.`);
    }
    seenLanguages.add(language);

    if (title.length < MIN_TITLE_LENGTH || body.length < MIN_BODY_LENGTH) {
      errors.push(
        `${language} copy needs a specific title and useful body, not a generic blast.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
