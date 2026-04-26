import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { mobileTheme } from "../src/components/Screen";

export default function HomeScreen() {
  const router = useRouter();
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const logoFloat = useRef(new Animated.Value(18)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const whiskerShift = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 10,
        stiffness: 120,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.timing(logoFloat, {
        toValue: 0,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textFade, {
        toValue: 1,
        duration: 520,
        delay: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(whiskerShift, {
            toValue: 8,
            duration: 720,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(whiskerShift, {
            toValue: -8,
            duration: 720,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();

    const timeout = setTimeout(() => {
      router.replace("/(auth)");
    }, 1650);

    return () => clearTimeout(timeout);
  }, [logoFloat, logoScale, router, textFade, whiskerShift]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.canvas}>
        <View pointerEvents="none" style={styles.glowPrimary} />
        <View pointerEvents="none" style={styles.glowSecondary} />
        <Animated.View style={[styles.logoWrap, { transform: [{ translateY: logoFloat }, { scale: logoScale }] }]}>
          <View style={styles.catBadge}>
            <View style={[styles.ear, styles.earLeft]} />
            <View style={[styles.ear, styles.earRight]} />
            <View style={styles.catFace}>
              <View style={styles.eyeRow}>
                <View style={styles.eye} />
                <View style={styles.eye} />
              </View>
              <View style={styles.nose} />
              <Animated.View style={[styles.whiskerRow, { transform: [{ translateX: whiskerShift }] }]}>
                <View style={styles.whiskerGroup}>
                  <View style={[styles.whisker, styles.whiskerTiltUp]} />
                  <View style={styles.whisker} />
                </View>
                <View style={styles.whiskerGroup}>
                  <View style={[styles.whisker, styles.whiskerTiltDown]} />
                  <View style={styles.whisker} />
                </View>
              </Animated.View>
            </View>
          </View>
          <Animated.View style={{ opacity: textFade }}>
            <Text style={styles.title}>Noira</Text>
            <Text style={styles.subtitle}>Fresh fashion with a softer start</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: mobileTheme.bg,
  },
  canvas: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    backgroundColor: mobileTheme.bg,
  },
  glowPrimary: {
    position: "absolute",
    top: 110,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: mobileTheme.accentSoft,
  },
  glowSecondary: {
    position: "absolute",
    left: -10,
    bottom: 140,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: mobileTheme.lavender,
  },
  logoWrap: {
    alignItems: "center",
    gap: 20,
  },
  catBadge: {
    width: 168,
    height: 168,
    alignItems: "center",
    justifyContent: "center",
  },
  ear: {
    position: "absolute",
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: mobileTheme.primary,
    transform: [{ rotate: "45deg" }],
  },
  earLeft: {
    left: 36,
  },
  earRight: {
    right: 36,
  },
  catFace: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: mobileTheme.primary,
    shadowColor: mobileTheme.shadow,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  eyeRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  eye: {
    width: 10,
    height: 18,
    borderRadius: 99,
    backgroundColor: "#fff",
  },
  nose: {
    width: 14,
    height: 10,
    borderRadius: 99,
    backgroundColor: "#fff4f8",
    marginBottom: 12,
  },
  whiskerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 112,
  },
  whiskerGroup: {
    gap: 8,
  },
  whisker: {
    width: 28,
    height: 3,
    borderRadius: 99,
    backgroundColor: "#fff",
  },
  whiskerTiltUp: {
    transform: [{ rotate: "-10deg" }],
  },
  whiskerTiltDown: {
    transform: [{ rotate: "10deg" }],
  },
  title: {
    color: mobileTheme.ink,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1.6,
    textAlign: "center",
  },
  subtitle: {
    color: mobileTheme.muted,
    fontSize: 15,
    textAlign: "center",
  },
});
