import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";

import { mobileTheme } from "./Screen";

export function FashionImageCarousel({
  imageUrls,
  aspectRatio = 3 / 4,
  autoAdvanceMs = 2600,
}: {
  imageUrls: string[];
  aspectRatio?: number;
  autoAdvanceMs?: number;
}) {
  const urls = useMemo(() => (imageUrls.length > 0 ? imageUrls : []), [imageUrls]);
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (urls.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % urls.length);
    }, autoAdvanceMs);

    return () => clearInterval(timer);
  }, [autoAdvanceMs, urls.length]);

  useEffect(() => {
    fade.setValue(0.74);
    Animated.timing(fade, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [fade, index]);

  if (urls.length === 0) {
    return <View style={[styles.empty, { aspectRatio }]} />;
  }

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ opacity: fade }}>
        <Image source={{ uri: urls[index] }} style={[styles.image, { aspectRatio }]} />
      </Animated.View>
      {urls.length > 1 ? (
        <View style={styles.dots}>
          {urls.map((_, dotIndex) => (
            <Pressable key={`${urls[dotIndex]}-${dotIndex}`} onPress={() => setIndex(dotIndex)} style={[styles.dot, dotIndex === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  image: {
    width: "100%",
    backgroundColor: mobileTheme.accentSoft,
  },
  empty: {
    width: "100%",
    backgroundColor: mobileTheme.accentSoft,
    borderRadius: 24,
  },
  dots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 7,
    width: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    width: 22,
    backgroundColor: "#fff",
  },
});
