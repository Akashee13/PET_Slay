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
  bg: "#fff7ed",
  ink: "#2b2118",
  muted: "#776859",
  card: "#fffaf2",
  line: "#ead8c4",
  primary: "#5a3f2b",
  accent: "#c47a35",
  sage: "#607a54",
  danger: "#a33b28",
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
    gap: 8,
  },
  eyebrow: {
    color: mobileTheme.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    color: mobileTheme.ink,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1.1,
    lineHeight: 36,
  },
  subtitle: {
    color: mobileTheme.muted,
    fontSize: 15,
    lineHeight: 21,
  },
});
