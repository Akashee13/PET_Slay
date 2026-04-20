# Localization Provider Options

Last updated: 2026-04-20

## Recommendation

Use in-repo translation dictionaries for fixed UI labels and navigation. They are free, fast, reliable, and let us intentionally write Hindi and Hinglish instead of depending on literal machine translation.

Use Google Cloud Translation for dynamic content such as product descriptions, campaign drafts, and notification copy. Dynamic translations should be cached, editable by admin, and reviewed before going live.

This keeps us in the GCP ecosystem and avoids designing around a tiny free-call provider. Google Cloud Translation's default general-model quota is high enough for MVP and early scale: 6,000,000 characters per minute per project, 6,000 v3 requests per minute, and 300,000 v2 requests per minute. Pricing is character-based, not low-call based: the NMT model includes the first 500,000 characters/month free as a credit, then $20 per million characters. Translation LLM text translation is listed at $10 per million input characters and $10 per million output characters.

## Provider Shortlist

| Provider | Best fit | Cost signal | Notes |
| --- | --- | --- | --- |
| Google Cloud Translation | Preferred provider for dynamic text | First 500,000 NMT characters/month free as credit, then $20 per million characters; Translation LLM text is priced per input/output characters | Best fit because PET_Slay already runs on GCP. High default quotas and official Hindi support. Supports glossary/custom model workflows later. |
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
- Google Cloud Translation quotas: https://docs.cloud.google.com/translate/quotas
- Google Cloud Translation language support: https://docs.cloud.google.com/translate/docs/languages
- LibreTranslate: https://github.com/LibreTranslate/LibreTranslate
- AI4Bharat IndicTrans2: https://github.com/AI4Bharat/IndicTrans2
