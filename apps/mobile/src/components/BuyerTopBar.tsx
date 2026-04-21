import { Pressable, StyleSheet, View } from "react-native";

import { BrandMark } from "./BrandMark";
import { mobileTheme } from "./Screen";

export function BuyerTopBar({
  name,
  tagline,
  onOpenMenu,
}: {
  name: string;
  tagline?: string;
  onOpenMenu: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.brandSlot}>
        <BrandMark name={name} tagline={tagline} />
      </View>
      <Pressable accessibilityLabel="Open account menu" accessibilityRole="button" onPress={onOpenMenu} style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}>
        <View style={styles.menuStack}>
          <View style={styles.menuLineLong} />
          <View style={styles.menuLineShort} />
          <View style={styles.menuLineLong} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 28,
    backgroundColor: "rgba(255, 253, 253, 0.96)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: mobileTheme.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
  },
  brandSlot: {
    flex: 1,
    minWidth: 0,
  },
  menuButton: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: mobileTheme.cardAlt,
    borderWidth: 1,
    borderColor: mobileTheme.line,
  },
  menuButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  menuStack: {
    gap: 5,
  },
  menuLineLong: {
    width: 18,
    height: 2.5,
    borderRadius: 99,
    backgroundColor: mobileTheme.ink,
  },
  menuLineShort: {
    alignSelf: "flex-end",
    width: 12,
    height: 2.5,
    borderRadius: 99,
    backgroundColor: mobileTheme.primaryDeep,
  },
});
