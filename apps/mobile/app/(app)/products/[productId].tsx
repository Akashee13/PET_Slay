import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { ProductDetail } from "@pet-slay/types";

import { ActionButton } from "../../../src/components/ActionButton";
import { mobileTheme, Screen } from "../../../src/components/Screen";
import { getPrimaryProductImage } from "../../../src/features/catalog/product-images";
import { mobileCopy } from "../../../src/i18n";
import { useBuyerApp, useSessionSnapshot } from "../../../src/state/buyer-app-context";

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { catalog } = useBuyerApp();
  const session = useSessionSnapshot();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) {
      return;
    }

    setLoading(true);
    setError("");
    catalog
      .loadProductDetail(productId, { language: session.language })
      .then(setProduct)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "product_load_failed"))
      .finally(() => setLoading(false));
  }, [catalog, productId, session.language]);

  if (loading) {
    return <Screen title={mobileCopy(session.language, "loadingProduct")} subtitle={mobileCopy(session.language, "loadingProductSubtitle")} />;
  }

  if (error || !product) {
    return (
      <Screen title={mobileCopy(session.language, "productUnavailable")} subtitle={mobileCopy(session.language, "productUnavailableSubtitle")}>
        <Text style={styles.error}>{error || "product_not_found"}</Text>
      </Screen>
    );
  }

  const primaryVariant = product.variants[0];

  return (
    <Screen eyebrow={product.category.replace("_", " ")} title={product.title} subtitle={product.description || mobileCopy(session.language, "productDetailFallbackSubtitle")}>
      <Image source={{ uri: getPrimaryProductImage(product) }} style={styles.heroImage} />
      <View style={styles.priceCard}>
        <Text style={styles.price}>₹{product.baseWholesalePrice} {mobileCopy(session.language, "wholesalePriceSuffix")}</Text>
        <Text style={styles.meta}>MOQ {product.moq} · {product.availabilityStatus.replace("_", " ")}</Text>
      </View>

      <View style={styles.variantCard}>
        <Text style={styles.sectionTitle}>{mobileCopy(session.language, "availableVariant")}</Text>
        {primaryVariant ? (
          <Text style={styles.meta}>
            {primaryVariant.sizeLabel}
            {primaryVariant.colorLabel ? ` · ${primaryVariant.colorLabel}` : ""} · {primaryVariant.availabilityStatus.replace("_", " ")}
          </Text>
        ) : (
          <Text style={styles.error}>{mobileCopy(session.language, "noVariantAvailable")}</Text>
        )}
      </View>

      {primaryVariant && (
        <Link
          href={{
            pathname: "/(app)/checkout",
            params: {
              productId: product.id,
              productTitle: product.title,
              variantId: primaryVariant.id,
              moq: String(product.moq),
              unitPrice: String(product.baseWholesalePrice),
            },
          }}
          asChild
        >
          <ActionButton label={mobileCopy(session.language, "startWholesaleOrder")} />
        </Link>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 26,
    backgroundColor: "#ead8c4",
  },
  priceCard: {
    gap: 4,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 20,
    backgroundColor: mobileTheme.card,
    padding: 16,
  },
  price: {
    color: mobileTheme.ink,
    fontSize: 24,
    fontWeight: "900",
  },
  meta: {
    color: mobileTheme.muted,
    fontSize: 15,
    lineHeight: 21,
    textTransform: "capitalize",
  },
  variantCard: {
    gap: 8,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 20,
    backgroundColor: "#fff1dc",
    padding: 16,
  },
  sectionTitle: {
    color: mobileTheme.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  error: {
    color: mobileTheme.danger,
    fontWeight: "800",
  },
});
