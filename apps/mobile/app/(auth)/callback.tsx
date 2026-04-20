import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";

import { ActionButton } from "../../src/components/ActionButton";
import { Screen, mobileTheme } from "../../src/components/Screen";
import { extractBearerTokenFromCallback } from "../../src/features/auth/social-auth-controller";
import { mobileCopy } from "../../src/i18n";
import { useBuyerApp, useSessionSnapshot } from "../../src/state/buyer-app-context";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { api, sessionStore } = useBuyerApp();
  const session = useSessionSnapshot();
  const [message, setMessage] = useState(mobileCopy(session.language, "finishingSignIn"));

  useEffect(() => {
    const token = extractBearerTokenFromCallback(params as Record<string, string | string[] | undefined>);
    if (!token) {
      setMessage(mobileCopy(session.language, "missingCallbackToken"));
      return;
    }

    sessionStore.setToken(token);
    sessionStore
      .bootstrap(api)
      .then(() => router.replace("/(app)"))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "session_bootstrap_failed"));
  }, [api, params, router, session.language, sessionStore]);

  return (
    <Screen title={mobileCopy(session.language, "finishingSignIn")} subtitle={mobileCopy(session.language, "authCallbackSubtitle")}>
      <Text style={{ color: message === mobileCopy(session.language, "missingCallbackToken") ? mobileTheme.danger : mobileTheme.muted }}>{message}</Text>
      <ActionButton label={mobileCopy(session.language, "backToCatalog")} variant="secondary" onPress={() => router.replace("/(auth)")} />
    </Screen>
  );
}
