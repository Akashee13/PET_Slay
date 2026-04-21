import { useEffect, useMemo, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";

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
      { key: "orders", label: mobileCopy(language, "orderHistory"), variant: "secondary" as const, onPress: onOrders },
      { key: "language", label: mobileCopy(language, "languagePreference"), variant: "secondary" as const, onPress: onLanguage },
      { key: "refresh", label: mobileCopy(language, "refreshCatalog"), variant: "secondary" as const, onPress: onRefresh },
      { key: "alerts", label: mobileCopy(language, "arrivalAlerts"), variant: "secondary" as const, onPress: onArrivalAlerts },
      { key: "signout", label: mobileCopy(language, "signOut"), variant: "danger" as const, onPress: onSignOut },
    ],
    [language, onArrivalAlerts, onLanguage, onOrders, onRefresh, onSignOut],
  );

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Animated.View pointerEvents="none" style={[styles.backdropTint, { opacity: fade }]} />
        <Pressable onPress={onClose} style={styles.backdropTouch} />
        <Animated.View style={[styles.panel, { transform: [{ translateX: slide }] }]}>
          <View style={styles.grabber} />
          <BrandMark name={mobileCopy(language, "appName")} tagline={mobileCopy(language, "brandTagline")} />
          <View style={styles.identityCard}>
            <Text style={styles.identityTitle}>{user?.businessName ?? mobileCopy(language, "resellerCatalog")}</Text>
            <Text style={styles.identityMeta}>{user?.email ?? mobileCopy(language, "authSubtitle")}</Text>
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
  identityTitle: {
    color: mobileTheme.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  identityMeta: {
    color: mobileTheme.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  actionList: {
    gap: 12,
  },
});
