import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { mobileTheme } from "./Screen";

export function ActionButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  ...pressableProps
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
} & Omit<ComponentProps<typeof Pressable>, "children" | "disabled" | "onPress" | "style">) {
  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        pressed && !disabled && !loading && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={variant === "secondary" ? mobileTheme.ink : "#fff"} size="small" />
        ) : null}
        <Text style={[styles.label, variant === "secondary" && styles.secondaryLabel]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: mobileTheme.primary,
    paddingHorizontal: 18,
    paddingVertical: 13,
    shadowColor: mobileTheme.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondary: {
    borderWidth: 1,
    borderColor: mobileTheme.line,
    backgroundColor: mobileTheme.cardAlt,
  },
  danger: {
    backgroundColor: mobileTheme.danger,
  },
  pressed: {
    transform: [{ translateY: 1 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  secondaryLabel: {
    color: mobileTheme.ink,
  },
});
