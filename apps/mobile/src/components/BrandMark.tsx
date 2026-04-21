import { StyleSheet, Text, View } from "react-native";

import { mobileTheme } from "./Screen";

export function BrandMark({
  name,
  tagline,
}: {
  name: string;
  tagline?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Text style={styles.badgeLetter}>N</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{name}</Text>
        {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    width: 52,
    borderRadius: 18,
    backgroundColor: mobileTheme.primary,
    shadowColor: mobileTheme.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 3,
  },
  badgeLetter: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  copy: {
    flexShrink: 1,
    gap: 2,
  },
  name: {
    color: mobileTheme.ink,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  tagline: {
    color: mobileTheme.muted,
    fontSize: 12,
    lineHeight: 16,
  },
});
