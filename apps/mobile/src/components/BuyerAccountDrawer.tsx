import { useEffect, useMemo, useRef } from "react";
import { Animated, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { CurrentUser, Language } from "@pet-slay/types";

import { ActionButton } from "./ActionButton";
import { BrandMark } from "./BrandMark";
import { mobileTheme } from "./Screen";
import { mobileCopy } from "../i18n";

export function BuyerAccountDrawer({
  visible,
  language,
  user,
  onClose,
  onAccount,
  onOrders,
  onLanguage,
  onRefresh,
  onArrivalAlerts,
  onSignOut,
}: {
  visible: boolean;
  language: Language;
  user: CurrentUser | null;
  onClose: () => void;
  onAccount: () => void;
  onOrders: () => void;
  onLanguage: () => void;
  onRefresh: () => void;
  onArrivalAlerts: () => void;
  onSignOut: () => void;
}) {
  const slide = useRef(new Animated.Value(360)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: visible ? 0 : 360,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: visible ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide, visible]);

  const actions = useMemo(
    () => [
      { key: "account", label: mobileCopy(language, "myAccount"), variant: "primary" as const, onPress: onAccount },
      { key: "orders", label: mobileCopy(language, "orderHistory"), variant: "secondary" as const, onPress: onOrders },
      { key: "language", label: mobileCopy(language, "languagePreference"), variant: "secondary" as const, onPress: onLanguage },
      { key: "refresh", label: mobileCopy(language, "refreshCatalog"), variant: "secondary" as const, onPress: onRefresh },
      { key: "alerts", label: mobileCopy(language, "arrivalAlerts"), variant: "secondary" as const, onPress: onArrivalAlerts },
      { key: "signout", label: mobileCopy(language, "signOut"), variant: "danger" as const, onPress: onSignOut },
    ],
    [language, onAccount, onArrivalAlerts, onLanguage, onOrders, onRefresh, onSignOut],
  );
  const identityName = user?.displayName || user?.businessName || mobileCopy(language, "resellerCatalog");
  const businessName = user?.businessName && user.businessName !== identityName ? user.businessName : "";

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Animated.View pointerEvents="none" style={[styles.backdropTint, { opacity: fade }]} />
        <Pressable onPress={onClose} style={styles.backdropTouch} />
        <Animated.View style={[styles.panel, { transform: [{ translateX: slide }] }]}>
          <View style={styles.grabber} />
          <BrandMark name={mobileCopy(language, "appName")} tagline={mobileCopy(language, "brandTagline")} />
          <View style={styles.identityCard}>
            <View style={styles.identityTopRow}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{identityName.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.identityCopy}>
                <Text style={styles.identityTitle}>{identityName}</Text>
                {businessName ? <Text style={styles.identityBusiness}>{businessName}</Text> : null}
                <Text style={styles.identityMeta}>{user?.email ?? mobileCopy(language, "authSubtitle")}</Text>
              </View>
            </View>
            {user?.phone || user?.region ? (
              <Text style={styles.identityFootnote}>{[user?.phone, user?.region].filter(Boolean).join(" · ")}</Text>
            ) : null}
          </View>
          <View style={styles.actionList}>
            {actions.map((action) => (
              <ActionButton
                key={action.key}
                label={action.label}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
                variant={action.variant}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(45, 18, 48, 0.24)",
  },
  backdropTouch: {
    flex: 1,
  },
  panel: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "84%",
    maxWidth: 360,
    gap: 18,
    borderLeftWidth: 1,
    borderColor: mobileTheme.line,
    backgroundColor: mobileTheme.card,
    paddingHorizontal: 18,
    paddingTop: 72,
    paddingBottom: 28,
    shadowColor: mobileTheme.shadow,
    shadowOpacity: 1,
    shadowRadius: 28,
    shadowOffset: {
      width: -8,
      height: 0,
    },
    elevation: 6,
  },
  grabber: {
    alignSelf: "center",
    width: 52,
    height: 5,
    borderRadius: 99,
    backgroundColor: mobileTheme.line,
  },
  identityCard: {
    gap: 6,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 24,
    backgroundColor: mobileTheme.cardAlt,
    padding: 16,
  },
  identityTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  identityCopy: {
    flex: 1,
    gap: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: mobileTheme.accentSoft,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: mobileTheme.accentSoft,
    borderWidth: 1,
    borderColor: mobileTheme.line,
  },
  avatarFallbackText: {
    color: mobileTheme.primaryDeep,
    fontSize: 24,
    fontWeight: "900",
  },
  identityTitle: {
    color: mobileTheme.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  identityBusiness: {
    color: mobileTheme.primaryDeep,
    fontSize: 13,
    fontWeight: "800",
  },
  identityMeta: {
    color: mobileTheme.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  identityFootnote: {
    color: mobileTheme.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  actionList: {
    gap: 12,
  },
});
