import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as ExpoLinking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { ActionButton } from "../../src/components/ActionButton";
import { BrandMark } from "../../src/components/BrandMark";
import { mobileTheme, Screen } from "../../src/components/Screen";
import { buildSupabaseOAuthUrl, createSocialAuthOptions, extractBearerTokenFromCallback, fetchSocialProviderStatus } from "../../src/features/auth/social-auth-controller";
import { mobileCopy } from "../../src/i18n";
import { getMobileSupabaseConfig } from "../../src/services/supabase";
import { useBuyerApp, useSessionSnapshot } from "../../src/state/buyer-app-context";
import { getDefaultBuyerToken } from "../../src/state/session-store";

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const router = useRouter();
  const { api, sessionStore } = useBuyerApp();
  const session = useSessionSnapshot();
  const [token, setToken] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleError, setGoogleError] = useState("");
  const supabaseConfig = getMobileSupabaseConfig();
  const redirectTo = ExpoLinking.createURL("/callback");
  const googleAvailable = Boolean(supabaseConfig.url && supabaseConfig.anonKey) && (googleEnabled || googleError.length > 0);
  const socialOptions = createSocialAuthOptions({
    supabaseUrl: supabaseConfig.url,
    redirectTo,
    googleEnabled: googleAvailable,
  });

  useEffect(() => {
    if (session.status === "authenticated") {
      router.replace("/(app)");
    }
  }, [router, session.status]);

  useEffect(() => {
    setGoogleLoading(true);
    fetchSocialProviderStatus({
      supabaseUrl: supabaseConfig.url,
      anonKey: supabaseConfig.anonKey,
    })
      .then((status) => {
        setGoogleEnabled(status.googleEnabled);
        setGoogleError("");
      })
      .catch(() => {
        setGoogleEnabled(Boolean(supabaseConfig.url && supabaseConfig.anonKey));
        setGoogleError("");
      })
      .finally(() => setGoogleLoading(false));
  }, [session.language, supabaseConfig.anonKey, supabaseConfig.url]);

  async function continueWithToken(nextToken: string) {
    sessionStore.setToken(nextToken.trim());
    await sessionStore.bootstrap(api);
  }

  async function continueWithGoogle() {
    try {
      const authUrl = buildSupabaseOAuthUrl("google", {
        supabaseUrl: supabaseConfig.url,
        redirectTo,
        googleEnabled: true,
      });
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
      if (result.type !== "success") {
        return;
      }

      const accessToken = extractBearerTokenFromCallback(result.url);
      if (!accessToken) {
        setGoogleError(mobileCopy(session.language, "missingCallbackToken"));
        return;
      }

      setGoogleError("");
      await continueWithToken(accessToken);
    } catch {
      setGoogleError(mobileCopy(session.language, "socialGoogleUnavailable"));
    }
  }

  return (
    <Screen
      eyebrow={mobileCopy(session.language, "authEyebrow")}
      title={mobileCopy(session.language, "authTitle")}
      subtitle={mobileCopy(session.language, "authSubtitle")}
    >
      <BrandMark name={mobileCopy(session.language, "appName")} tagline={mobileCopy(session.language, "brandTagline")} />
      <View style={styles.gmailHero}>
        <View style={styles.gmailHeroHeader}>
          <View style={styles.gmailBadge}>
            <Text style={styles.gmailBadgeText}>G</Text>
          </View>
          <View style={styles.gmailCopy}>
            <Text style={styles.gmailTitle}>{mobileCopy(session.language, "gmailPriorityTitle")}</Text>
            <Text style={styles.gmailBody}>{mobileCopy(session.language, "gmailPriorityBody")}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!googleAvailable || googleLoading}
          onPress={() => {
            if (googleAvailable) {
              void continueWithGoogle();
            }
          }}
          style={({ pressed }) => [
            styles.gmailButton,
            (!googleAvailable || googleLoading) && styles.gmailButtonDisabled,
            pressed && googleAvailable && !googleLoading && styles.gmailButtonPressed,
          ]}
        >
          <View style={styles.gmailButtonRow}>
            {googleLoading ? <Text style={styles.gmailButtonIcon}>...</Text> : <Text style={styles.gmailButtonIcon}>G</Text>}
            <Text style={styles.gmailButtonLabel}>{mobileCopy(session.language, "continueWithGmail")}</Text>
          </View>
        </Pressable>
        {!googleAvailable && !googleLoading ? <Text style={styles.providerHint}>{mobileCopy(session.language, "socialGoogleUnavailable")}</Text> : null}
        {googleError ? <Text style={styles.error}>{googleError}</Text> : null}
      </View>
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
        {socialOptions.filter((option) => option.provider !== "google").map((option) => (
          <View key={option.provider} style={styles.providerCard}>
            <ActionButton
              label={`${option.label} ${mobileCopy(session.language, "socialComingSoon").toLowerCase()}`}
              variant="secondary"
              disabled
              onPress={() => {}}
            />
            <Text style={styles.providerHint}>
              {option.provider === "facebook"
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
  gmailHero: {
    gap: 12,
    borderWidth: 1,
    borderColor: "#f0d4df",
    borderRadius: 30,
    backgroundColor: "#fffdfd",
    padding: 18,
    shadowColor: mobileTheme.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
  },
  gmailHeroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gmailBadge: {
    alignItems: "center",
    justifyContent: "center",
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ead7e0",
  },
  gmailBadgeText: {
    color: "#db4437",
    fontSize: 24,
    fontWeight: "900",
  },
  gmailCopy: {
    flex: 1,
    gap: 4,
  },
  gmailTitle: {
    color: mobileTheme.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  gmailBody: {
    color: mobileTheme.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  gmailButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e8d3db",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  gmailButtonDisabled: {
    opacity: 0.55,
  },
  gmailButtonPressed: {
    transform: [{ translateY: 1 }],
  },
  gmailButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  gmailButtonIcon: {
    color: "#db4437",
    fontSize: 22,
    fontWeight: "900",
  },
  gmailButtonLabel: {
    color: mobileTheme.ink,
    fontSize: 16,
    fontWeight: "900",
  },
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
