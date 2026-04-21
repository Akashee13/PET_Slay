import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { ProductDetail } from "@pet-slay/types";

import { ActionButton } from "../../../src/components/ActionButton";
import { FashionImageCarousel } from "../../../src/components/FashionImageCarousel";
import { mobileTheme, Screen } from "../../../src/components/Screen";
import { getProductImageUrls } from "../../../src/features/catalog/product-images";
import { buildWhatsappOrderUrl } from "../../../src/features/orders/whatsapp-order";
import { mobileCopy } from "../../../src/i18n";
import { useBuyerApp, useSessionSnapshot } from "../../../src/state/buyer-app-context";

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { catalog } = useBuyerApp();
  const session = useSessionSnapshot();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  const currentProduct = product;
  const primaryVariant = currentProduct.variants[0];
  const imageUrls = getProductImageUrls(currentProduct);

  async function sendOrderToWhatsapp() {
    try {
      const url = buildWhatsappOrderUrl({
        businessName: session.user?.businessName,
        productTitle: currentProduct.title,
        productImageUrl: imageUrls[0],
        quantity: currentProduct.moq,
        moq: currentProduct.moq,
        unitPrice: currentProduct.baseWholesalePrice,
      });
      await Linking.openURL(url);
      setMessage(mobileCopy(session.language, "whatsappReady"));
    } catch {
      setMessage(mobileCopy(session.language, "whatsappFailed"));
    }
  }

  return (
    <Screen eyebrow={currentProduct.category.replace("_", " ")} title={currentProduct.title} subtitle={currentProduct.description || mobileCopy(session.language, "productDetailFallbackSubtitle")}>
      <FashionImageCarousel imageUrls={imageUrls} aspectRatio={3 / 4} />
      <View style={styles.priceCard}>
        <Text style={styles.price}>₹{currentProduct.baseWholesalePrice} {mobileCopy(session.language, "wholesalePriceSuffix")}</Text>
        <Text style={styles.meta}>MOQ {currentProduct.moq} · {currentProduct.availabilityStatus.replace("_", " ")}</Text>
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

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>{mobileCopy(session.language, "whatsappOrderingTitle")}</Text>
        <Text style={styles.noticeBody}>{mobileCopy(session.language, "whatsappOrderingBody")}</Text>
      </View>
      {message ? <Text style={styles.success}>{message}</Text> : null}
      {primaryVariant ? (
        <Pressable accessibilityRole="button" onPress={() => void sendOrderToWhatsapp()} style={({ pressed }) => [styles.whatsappButton, pressed && styles.whatsappButtonPressed]}>
          <View style={styles.whatsappButtonRow}>
            <Text style={styles.whatsappIcon}>W</Text>
            <View style={styles.whatsappCopy}>
              <Text style={styles.whatsappLabel}>{mobileCopy(session.language, "sendViaWhatsapp")}</Text>
              <Text style={styles.whatsappHint}>{mobileCopy(session.language, "openWhatsappChat")}</Text>
            </View>
          </View>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  priceCard: {
    gap: 4,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 24,
    backgroundColor: mobileTheme.card,
    padding: 18,
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
    borderRadius: 24,
    backgroundColor: mobileTheme.cardAlt,
    padding: 18,
  },
  notice: {
    gap: 6,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 24,
    backgroundColor: mobileTheme.cardAlt,
    padding: 18,
  },
  noticeTitle: {
    color: mobileTheme.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  noticeBody: {
    color: mobileTheme.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  whatsappButton: {
    borderRadius: 24,
    backgroundColor: "#1f9d55",
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: "rgba(31,157,85,0.28)",
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },
  whatsappButtonPressed: {
    transform: [{ translateY: 1 }],
  },
  whatsappButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  whatsappIcon: {
    width: 42,
    height: 42,
    lineHeight: 42,
    borderRadius: 21,
    overflow: "hidden",
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  whatsappCopy: {
    flex: 1,
    gap: 3,
  },
  whatsappLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  whatsappHint: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
  },
  sectionTitle: {
    color: mobileTheme.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  success: {
    color: mobileTheme.sage,
    fontWeight: "800",
  },
  error: {
    color: mobileTheme.danger,
    fontWeight: "800",
  },
});
