import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../../src/components/ActionButton";
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
  const [token, setToken] = useState(getDefaultBuyerToken());
  const socialOptions = createSocialAuthOptions({
    supabaseUrl: getMobileSupabaseConfig().url,
    redirectTo: "petslay://auth/callback",
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
          label={session.status === "authenticating" ? mobileCopy(session.language, "checkingSession") : mobileCopy(session.language, "continueToCatalog")}
          onPress={() => void continueWithToken(token)}
        />
        {session.status === "error" && <Text style={styles.error}>{session.error}</Text>}
      </View>

      <View style={styles.providerGrid}>
        {socialOptions.map((option) => (
          <View key={option.provider} style={styles.providerCard}>
            <ActionButton label={option.enabled ? option.label : `${option.label} soon`} variant="secondary" disabled={!option.enabled} />
            {option.setupHint && <Text style={styles.providerHint}>{mobileCopy(session.language, "socialSetupPending")}</Text>}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 24,
    backgroundColor: mobileTheme.card,
    padding: 18,
  },
  cardTitle: {
    color: mobileTheme.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  cardCopy: {
    color: mobileTheme.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 14,
    backgroundColor: "#fff",
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
  },
  providerHint: {
    color: mobileTheme.muted,
    fontSize: 12,
  },
});
