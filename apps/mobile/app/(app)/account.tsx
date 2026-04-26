import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../../src/components/ActionButton";
import { mobileTheme, Screen } from "../../src/components/Screen";
import { mobileCopy } from "../../src/i18n";
import { useBuyerApp, useSessionSnapshot } from "../../src/state/buyer-app-context";

export default function AccountScreen() {
  const { api, sessionStore } = useBuyerApp();
  const session = useSessionSnapshot();
  const initialUser = session.user;
  const [displayName, setDisplayName] = useState(initialUser?.displayName ?? "");
  const [businessName, setBusinessName] = useState(initialUser?.businessName ?? "");
  const [phone, setPhone] = useState(initialUser?.phone ?? "");
  const [region, setRegion] = useState(initialUser?.region ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialUser?.avatarUrl ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(initialUser?.displayName ?? "");
    setBusinessName(initialUser?.businessName ?? "");
    setPhone(initialUser?.phone ?? "");
    setRegion(initialUser?.region ?? "");
    setAvatarUrl(initialUser?.avatarUrl ?? "");
  }, [initialUser?.avatarUrl, initialUser?.businessName, initialUser?.displayName, initialUser?.phone, initialUser?.region]);

  const previewName = useMemo(
    () => displayName.trim() || businessName.trim() || initialUser?.email || mobileCopy(session.language, "myAccount"),
    [businessName, displayName, initialUser?.email, session.language],
  );

  async function saveProfile() {
    setMessage("");
    try {
      setSaving(true);
      const updated = await api.updateProfile({
        displayName: displayName.trim(),
        businessName: businessName.trim(),
        phone: phone.trim(),
        region: region.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      sessionStore.setUser(updated);
      setMessage(mobileCopy(session.language, "profileSaved"));
    } catch {
      setMessage(mobileCopy(session.language, "profileSaveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      eyebrow={mobileCopy(session.language, "myAccount")}
      title={mobileCopy(session.language, "myAccountTitle")}
      subtitle={mobileCopy(session.language, "myAccountSubtitle")}
    >
      <View style={styles.heroCard}>
        {avatarUrl.trim() ? (
          <Image source={{ uri: avatarUrl.trim() }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{previewName.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.heroCopy}>
          <Text style={styles.heroName}>{previewName}</Text>
          {businessName.trim() ? <Text style={styles.heroBusiness}>{businessName.trim()}</Text> : null}
          <Text style={styles.heroMeta}>{initialUser?.email}</Text>
          <Text style={styles.heroHint}>{mobileCopy(session.language, "accountTip")}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{mobileCopy(session.language, "accountIdentity")}</Text>
        <Text style={styles.label}>{mobileCopy(session.language, "fullName")}</Text>
        <TextInput onChangeText={setDisplayName} style={styles.input} value={displayName} />
        <Text style={styles.label}>{mobileCopy(session.language, "profileImageUrl")}</Text>
        <TextInput autoCapitalize="none" onChangeText={setAvatarUrl} style={styles.input} value={avatarUrl} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{mobileCopy(session.language, "accountBusiness")}</Text>
        <Text style={styles.label}>{mobileCopy(session.language, "businessNameLabel")}</Text>
        <TextInput onChangeText={setBusinessName} style={styles.input} value={businessName} />
        <Text style={styles.label}>{mobileCopy(session.language, "phoneNumber")}</Text>
        <TextInput keyboardType="phone-pad" onChangeText={setPhone} style={styles.input} value={phone} />
        <Text style={styles.label}>{mobileCopy(session.language, "regionLabel")}</Text>
        <TextInput onChangeText={setRegion} style={styles.input} value={region} />
      </View>

      {message ? <Text style={message === mobileCopy(session.language, "profileSaved") ? styles.success : styles.error}>{message}</Text> : null}

      <ActionButton
        disabled={saving}
        loading={saving}
        label={saving ? mobileCopy(session.language, "saving") : mobileCopy(session.language, "saveProfile")}
        onPress={() => void saveProfile()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    flexDirection: "row",
    gap: 16,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 30,
    backgroundColor: mobileTheme.card,
    padding: 20,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: mobileTheme.accentSoft,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: mobileTheme.accentSoft,
    borderWidth: 1,
    borderColor: mobileTheme.line,
  },
  avatarFallbackText: {
    color: mobileTheme.primaryDeep,
    fontSize: 34,
    fontWeight: "900",
  },
  heroName: {
    color: mobileTheme.ink,
    fontSize: 24,
    fontWeight: "900",
  },
  heroBusiness: {
    color: mobileTheme.primaryDeep,
    fontSize: 14,
    fontWeight: "800",
  },
  heroMeta: {
    color: mobileTheme.muted,
    fontSize: 13,
  },
  heroHint: {
    marginTop: 4,
    color: mobileTheme.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    gap: 8,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 24,
    backgroundColor: mobileTheme.cardAlt,
    padding: 18,
  },
  sectionTitle: {
    color: mobileTheme.ink,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  label: {
    color: mobileTheme.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 18,
    backgroundColor: mobileTheme.card,
    color: mobileTheme.ink,
    paddingHorizontal: 14,
  },
  success: {
    color: mobileTheme.sage,
    fontWeight: "900",
  },
  error: {
    color: mobileTheme.danger,
    fontWeight: "900",
  },
});
