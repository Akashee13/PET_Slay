import {
  translate,
  translationResources,
  type AppLanguage,
  type TranslationKey
} from "@pet-slay/design-tokens";

export { translationResources, type AppLanguage, type TranslationKey };

export function mobileCopy(language: AppLanguage, key: TranslationKey): string {
  return translate(language, key);
}
