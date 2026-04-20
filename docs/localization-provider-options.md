# Localization Provider Options

Last updated: 2026-04-20

## Recommendation

Use in-repo translation dictionaries for fixed UI labels and navigation. They are free, fast, reliable, and let us intentionally write Hindi and Hinglish instead of depending on literal machine translation.

Use a translation provider only for dynamic content such as product descriptions, campaign drafts, and notification copy. Dynamic translations should be cached, editable by admin, and reviewed before going live.

## Provider Shortlist

| Provider | Best fit | Cost signal | Notes |
| --- | --- | --- | --- |
| Google Cloud Translation | Easiest stage integration because PET_Slay already runs on GCP | Basic translation includes a monthly credit for the first 500,000 characters; paid after that | Good first provider if we want one cloud account and can use GCP credits. Supports glossary workflows later. |
| Azure AI Translator | Lowest friction free tier if we are okay with another cloud account | F0 lists 2 million characters/month free | Good candidate for experimentation and low-volume dynamic translation. Adds another provider/account to manage. |
| LibreTranslate | Dev/self-hosted fallback | Open-source and self-hosted, but hosting is not free | Useful for local/dev or privacy-sensitive future work. Public anonymous endpoints should not be treated as production infrastructure. |
| AI4Bharat IndicTrans2 | Indic-language quality exploration | Open model, but running it needs model hosting/compute | Strong India-focused option for later, especially if Hindi quality becomes a differentiator. Not the cheapest MVP runtime path. |

## Architecture Guardrails

- Store canonical copy in English, Hindi, and Hinglish dictionaries for UI.
- Treat Hinglish as product copywriting, not a standard translation target.
- Add a Go translation adapter only for dynamic content, behind a provider interface.
- Cache dynamic translations by source text hash, source language, target language, and provider.
- Keep an admin review/edit step before publishing translated campaigns or product copy.
- Add a glossary for category, fabric, sizing, and brand terms so machine translations do not damage fashion-specific language.

## Sources

- Google Cloud Translation pricing: https://cloud.google.com/translate/pricing
- Azure Translator pricing: https://azure.microsoft.com/en-us/pricing/details/translator/
- LibreTranslate: https://github.com/LibreTranslate/LibreTranslate
- AI4Bharat IndicTrans2: https://github.com/AI4Bharat/IndicTrans2
