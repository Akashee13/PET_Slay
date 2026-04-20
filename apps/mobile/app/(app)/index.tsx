import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ProductCard } from "@pet-slay/types";

import { ActionButton } from "../../src/components/ActionButton";
import { mobileTheme, Screen } from "../../src/components/Screen";
import { mobileCopy } from "../../src/i18n";
import { useBuyerApp, useSessionSnapshot } from "../../src/state/buyer-app-context";

const FALLBACK_IMAGE = "https://image.pollinations.ai/prompt/minimal%20fashion%20lookbook%20card?width=900&height=1200&nologo=true";

export default function CatalogScreen() {
  const router = useRouter();
  const { api, catalog, sessionStore } = useBuyerApp();
  const session = useSessionSnapshot();
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session.status === "anonymous") {
      void sessionStore.bootstrap(api);
    }
  }, [api, session.status, sessionStore]);

  useEffect(() => {
    if (session.status === "error") {
      router.replace("/(auth)");
    }
    if (session.status !== "authenticated") {
      return;
    }

    setLoading(true);
    setError("");
    catalog
      .loadProducts()
      .then(setProducts)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "catalog_load_failed"))
      .finally(() => setLoading(false));
  }, [catalog, router, session.status]);

  if (session.status !== "authenticated") {
    return (
      <Screen title="Preparing your catalog" subtitle="Checking reseller session and loading fresh arrivals.">
        <Text style={styles.muted}>Please wait...</Text>
      </Screen>
    );
  }

  return (
    <Screen
      eyebrow={session.user?.businessName ?? "Reseller catalog"}
      title={mobileCopy(session.language, "resellerWelcome")}
      subtitle="Wholesale-first women’s western and South Asian fashion, curated for fast restock decisions."
    >
      <View style={styles.toolbar}>
        <Link href="/(app)/language" asChild>
          <Pressable style={styles.tile}>
            <Text style={styles.tileLabel}>Language</Text>
            <Text style={styles.tileValue}>{session.language}</Text>
          </Pressable>
        </Link>
        <ActionButton label="Refresh" variant="secondary" onPress={() => router.replace("/(app)")} />
      </View>

      {loading && <Text style={styles.muted}>Loading products...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && products.length === 0 && <Text style={styles.muted}>No reseller-visible products yet.</Text>}

      <View style={styles.grid}>
        {products.map((product) => (
          <Link key={product.id} href={`/(app)/products/${product.id}`} asChild>
            <Pressable style={styles.productCard}>
              <Image source={{ uri: product.coverImageUrl ?? product.imageUrls?.[0] ?? FALLBACK_IMAGE }} style={styles.productImage} />
              <View style={styles.productBody}>
                <Text style={styles.category}>{product.category.replace("_", " ")}</Text>
                <Text style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.price}>₹{product.baseWholesalePrice} wholesale · MOQ {product.moq}</Text>
                <Text style={styles.status}>{product.availabilityStatus.replace("_", " ")}</Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    gap: 10,
  },
  tile: {
    flex: 1,
    gap: 4,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 18,
    backgroundColor: mobileTheme.card,
    padding: 14,
  },
  tileLabel: {
    color: mobileTheme.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  tileValue: {
    color: mobileTheme.ink,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  grid: {
    gap: 16,
  },
  productCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 24,
    backgroundColor: mobileTheme.card,
  },
  productImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "#ead8c4",
  },
  productBody: {
    gap: 6,
    padding: 14,
  },
  category: {
    color: mobileTheme.accent,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  productTitle: {
    color: mobileTheme.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  price: {
    color: mobileTheme.muted,
    fontSize: 14,
  },
  status: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: "capitalize",
  },
  muted: {
    color: mobileTheme.muted,
  },
  error: {
    color: mobileTheme.danger,
    fontWeight: "700",
  },
});
