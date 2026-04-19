import { translationResources, type AppLanguage, type TranslationKey } from "./resources";

export { translationResources, type AppLanguage, type TranslationKey };

export function translate(language: AppLanguage, key: TranslationKey): string {
  return translationResources[language][key];
}
