import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../../src/components/ActionButton";
import { BrandMark } from "../../src/components/BrandMark";
import { mobileTheme, Screen } from "../../src/components/Screen";
import { createSocialAuthOptions } from "../../src/features/auth/social-auth-controller";
import { mobileCopy } from "../../src/i18n";
import { getMobileSupabaseConfig } from "../../src/services/supabase";
import { useBuyerApp, useSessionSnapshot } from "../../src/state/buyer-app-context";
import { getDefaultBuyerToken } from "../../src/state/session-store";

export default function AuthScreen() {
  const router = useRouter();
  const { api, sessionStore } = useBuyerApp();
  const session = useSessionSnapshot();
  const [token, setToken] = useState("");
  const socialOptions = createSocialAuthOptions({
    supabaseUrl: getMobileSupabaseConfig().url,
    redirectTo: "petslay://auth/callback",
    googleEnabled: process.env.EXPO_PUBLIC_GOOGLE_AUTH_ENABLED === "true",
  });

  useEffect(() => {
    if (session.status === "authenticated") {
      router.replace("/(app)");
    }
  }, [router, session.status]);

  async function continueWithToken(nextToken: string) {
    sessionStore.setToken(nextToken.trim());
    await sessionStore.bootstrap(api);
  }

  return (
    <Screen
      eyebrow={mobileCopy(session.language, "authEyebrow")}
      title={mobileCopy(session.language, "authTitle")}
      subtitle={mobileCopy(session.language, "authSubtitle")}
    >
      <BrandMark name={mobileCopy(session.language, "appName")} tagline={mobileCopy(session.language, "brandTagline")} />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{mobileCopy(session.language, "founderAccess")}</Text>
        <Text style={styles.cardCopy}>{mobileCopy(session.language, "founderAccessBody")}</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={setToken}
          placeholder={mobileCopy(session.language, "buyerBearerToken")}
          placeholderTextColor="#9b8a7a"
          style={styles.input}
          value={token}
        />
        <ActionButton
          disabled={session.status === "authenticating" || token.trim().length === 0}
          loading={session.status === "authenticating"}
          label={session.status === "authenticating" ? mobileCopy(session.language, "checkingSession") : mobileCopy(session.language, "continueToCatalog")}
          onPress={() => void continueWithToken(token)}
        />
        {getDefaultBuyerToken() ? (
          <ActionButton
            label={mobileCopy(session.language, "useLocalDemoToken")}
            variant="secondary"
            onPress={() => {
              setToken(getDefaultBuyerToken());
            }}
          />
        ) : null}
        {session.status === "error" && <Text style={styles.error}>{session.error}</Text>}
      </View>

      <View style={styles.providerGrid}>
        {socialOptions.map((option) => (
          <View key={option.provider} style={styles.providerCard}>
            <ActionButton
              label={option.provider === "google" ? mobileCopy(session.language, "continueWithGmail") : `${option.label} ${mobileCopy(session.language, "socialComingSoon").toLowerCase()}`}
              variant="secondary"
              disabled={!option.enabled}
              onPress={() => {
                if (option.url) {
                  void Linking.openURL(option.url);
                }
              }}
            />
            <Text style={styles.providerHint}>
              {option.provider === "google"
                ? option.enabled
                  ? mobileCopy(session.language, "socialGoogleHelper")
                  : mobileCopy(session.language, "socialGoogleUnavailable")
                : option.provider === "facebook"
                  ? mobileCopy(session.language, "socialFacebookHelper")
                  : mobileCopy(session.language, "socialInstagramHelper")}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 28,
    backgroundColor: mobileTheme.card,
    padding: 20,
  },
  cardTitle: {
    color: mobileTheme.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  cardCopy: {
    color: mobileTheme.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 18,
    backgroundColor: mobileTheme.cardAlt,
    color: mobileTheme.ink,
    paddingHorizontal: 14,
  },
  error: {
    color: mobileTheme.danger,
    fontWeight: "700",
  },
  providerGrid: {
    gap: 10,
  },
  providerCard: {
    gap: 6,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 22,
    backgroundColor: mobileTheme.cardAlt,
    padding: 14,
  },
  providerHint: {
    color: mobileTheme.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
