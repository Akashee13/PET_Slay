# Noira Seller Android Release Notes

## Brand

- Consumer-facing brand: `Noira`
- Seller app name: `Noira Seller`
- Android package: `com.noira.reseller`

## Environment

1. Copy [`apps/mobile/.env.example`](/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/.env.example) to `.env.local`.
2. Fill `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Set `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=true` only after Google is enabled in Supabase Auth providers and the redirect URI is configured.
4. Keep `EXPO_PUBLIC_BUYER_BEARER_TOKEN` empty for Gmail login testing, or set a stage buyer token for token-based QA.

## Build Profiles

- `development`: dev client builds
- `preview`: internal APK/AAB distribution for QA
- `production`: Play Store-ready Android App Bundle

## Local Commands

```bash
cd apps/mobile
npm install
npx expo start --tunnel
```

## EAS Build Commands

```bash
cd apps/mobile
npx eas login
npx eas build:configure
npx eas build --platform android --profile preview
npx eas build --platform android --profile production
```

## Release Readiness Check

```bash
./scripts/check-mobile-release-readiness.sh
```

## Play Console Checklist

1. Create the app as `Noira Seller` in Google Play Console.
2. Enable Play App Signing.
3. Upload the production `.aab` from EAS.
4. Complete Data safety, content rating, and store listing.
5. Start on the `internal` track before wider rollout.

## Security Checklist

- Keep Google sign-in client secrets only in Supabase/Auth provider settings, never in the app bundle.
- Do not ship founder/admin tokens in Expo public env vars.
- Use Play App Signing and Play Integrity before broad rollout.
- Keep only stage-safe public keys in `EXPO_PUBLIC_*`.
- Prefer Google Cloud Translation for scalable English/Hindi copy expansion when dynamic translation becomes necessary.

## Translation Recommendation

- For managed English/Hindi translation inside the GCP ecosystem, use Cloud Translation.
- Keep core commerce copy curated in-repo for trust-sensitive flows like auth, pricing, MOQ, refunds, and checkout.
