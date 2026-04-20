import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { mobileTheme } from "./Screen";

export function ActionButton({
  label,
  onPress,
  disabled,
  variant = "primary",
  ...pressableProps
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
} & Omit<ComponentProps<typeof Pressable>, "children" | "disabled" | "onPress" | "style">) {
  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, variant === "secondary" && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: mobileTheme.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondary: {
    borderWidth: 1,
    borderColor: mobileTheme.line,
    backgroundColor: mobileTheme.card,
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
  },
  secondaryLabel: {
    color: mobileTheme.ink,
  },
});
