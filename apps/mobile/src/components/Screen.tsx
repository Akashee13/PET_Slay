import { ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export function Screen({
  children,
  eyebrow,
  title,
  subtitle,
}: {
  children?: ReactNode;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View pointerEvents="none" style={styles.heroGlowPrimary} />
        <View pointerEvents="none" style={styles.heroGlowSecondary} />
        {(eyebrow || title || subtitle) && (
          <View style={styles.header}>
            {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export const mobileTheme = {
  bg: "#fff6fb",
  bgAlt: "#ffeaf4",
  ink: "#2d1230",
  muted: "#7b5f73",
  card: "#fffdfd",
  cardAlt: "#fff1f8",
  line: "#f3c8da",
  primary: "#e91e63",
  primaryDeep: "#b31252",
  accent: "#ff7aa2",
  accentSoft: "#ffd4e4",
  lavender: "#f6e6ff",
  sage: "#3d915d",
  danger: "#c73f65",
  shadow: "rgba(179, 18, 82, 0.12)",
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: mobileTheme.bg,
  },
  content: {
    gap: 18,
    padding: 18,
    paddingBottom: 44,
  },
  header: {
    gap: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 30,
    backgroundColor: mobileTheme.card,
    padding: 20,
    shadowColor: mobileTheme.shadow,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 3,
  },
  eyebrow: {
    color: mobileTheme.primaryDeep,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  title: {
    color: mobileTheme.ink,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.4,
    lineHeight: 38,
  },
  subtitle: {
    color: mobileTheme.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroGlowPrimary: {
    position: "absolute",
    right: -10,
    top: 10,
    height: 150,
    width: 150,
    borderRadius: 999,
    backgroundColor: mobileTheme.accentSoft,
  },
  heroGlowSecondary: {
    position: "absolute",
    left: -30,
    top: 120,
    height: 110,
    width: 110,
    borderRadius: 999,
    backgroundColor: mobileTheme.lavender,
    opacity: 0.8,
  },
});
