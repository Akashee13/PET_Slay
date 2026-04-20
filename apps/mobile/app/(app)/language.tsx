import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Language } from "@pet-slay/types";

import { ActionButton } from "../../src/components/ActionButton";
import { mobileTheme, Screen } from "../../src/components/Screen";
import { mobileCopy } from "../../src/i18n";
import { useBuyerApp, useSessionSnapshot } from "../../src/state/buyer-app-context";

const LANGUAGE_OPTIONS: Array<{ value: Language; label: string; helper: string }> = [
  { value: "english", label: "English", helper: "Simple operations copy for catalog and checkout." },
  { value: "hindi", label: "हिन्दी", helper: "Hindi-first support for North India reseller buyers." },
  { value: "hinglish", label: "Hinglish", helper: "Daily-business language for WhatsApp-style selling." },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { language } = useBuyerApp();
  const session = useSessionSnapshot();
  const [saving, setSaving] = useState<Language | null>(null);
  const [error, setError] = useState("");

  async function selectLanguage(nextLanguage: Language) {
    setSaving(nextLanguage);
    setError("");
    try {
      await language.selectLanguage(nextLanguage);
      router.replace("/(app)");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "language_save_failed");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Screen
      eyebrow={mobileCopy(session.language, "languagePreference")}
      title={mobileCopy(session.language, "chooseBuyerLanguage")}
      subtitle={mobileCopy(session.language, "languageSubtitle")}
    >
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.list}>
        {LANGUAGE_OPTIONS.map((option) => {
          const selected = session.language === option.value;
          return (
            <View key={option.value} style={[styles.card, selected && styles.selectedCard]}>
              <View style={styles.copy}>
                <Text style={styles.label}>{option.label}</Text>
                <Text style={styles.helper}>{option.helper}</Text>
              </View>
              <ActionButton
                disabled={saving !== null}
                label={saving === option.value ? "Saving..." : selected ? "Selected" : "Use this"}
                onPress={() => void selectLanguage(option.value)}
                variant={selected ? "secondary" : "primary"}
              />
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 22,
    backgroundColor: mobileTheme.card,
    padding: 16,
  },
  selectedCard: {
    borderColor: mobileTheme.accent,
    backgroundColor: "#fff1dc",
  },
  copy: {
    gap: 5,
  },
  label: {
    color: mobileTheme.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  helper: {
    color: mobileTheme.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: mobileTheme.danger,
    fontWeight: "800",
  },
});
