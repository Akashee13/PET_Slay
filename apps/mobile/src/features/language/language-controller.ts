import type { Language } from "@pet-slay/types";

import type { BuyerApiClient } from "../../services/buyer-api";
import type { SessionStore } from "../../state/session-store";

export type LanguageController = {
  selectLanguage: (language: Language) => Promise<{ preferredLanguage: Language }>;
};

export function createLanguageController(options: { api: BuyerApiClient; sessionStore: SessionStore }): LanguageController {
  return {
    async selectLanguage(language) {
      const updated = await options.api.updateLanguage(language);
      options.sessionStore.setLanguage(updated.preferredLanguage);
      return updated;
    },
  };
}
