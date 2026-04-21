import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { ProductDetail } from "@pet-slay/types";

import { ActionButton } from "../../../src/components/ActionButton";
import { BuyerAccountDrawer } from "../../../src/components/BuyerAccountDrawer";
import { BuyerTopBar } from "../../../src/components/BuyerTopBar";
import { FashionImageCarousel } from "../../../src/components/FashionImageCarousel";
import { mobileTheme } from "../../../src/components/Screen";
import { getProductImageUrls } from "../../../src/features/catalog/product-images";
import { buildWhatsappOrderUrl } from "../../../src/features/orders/whatsapp-order";
import { mobileCopy } from "../../../src/i18n";
import { useBuyerApp, useSessionSnapshot } from "../../../src/state/buyer-app-context";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { api, catalog, notifications, sessionStore } = useBuyerApp();
  const session = useSessionSnapshot();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [orderError, setOrderError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (session.status === "anonymous") {
      void sessionStore.bootstrap(api);
    }
  }, [api, session.status, sessionStore]);

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
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallbackWrap}>
          <Text style={styles.fallbackTitle}>{mobileCopy(session.language, "loadingProduct")}</Text>
          <Text style={styles.fallbackSubtitle}>{mobileCopy(session.language, "loadingProductSubtitle")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallbackWrap}>
          <Text style={styles.fallbackTitle}>{mobileCopy(session.language, "productUnavailable")}</Text>
          <Text style={styles.fallbackSubtitle}>{mobileCopy(session.language, "productUnavailableSubtitle")}</Text>
          <Text style={styles.error}>{error || "product_not_found"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentProduct = product;
  const primaryVariant = currentProduct.variants[0];
  const imageUrls = getProductImageUrls(currentProduct);
  const minimumOrderQuantity = String(currentProduct.moq);
  const availableSizes = Array.from(
    new Set(
      currentProduct.variants
        .map((variant) => variant.sizeLabel?.trim())
        .filter((sizeLabel): sizeLabel is string => Boolean(sizeLabel))
        .concat(Object.keys(currentProduct.sizeChart ?? {}).filter(Boolean)),
    ),
  );

  async function sendOrderToWhatsapp() {
    try {
      await Linking.openURL("https://wa.me/918292349038");
      setMessage(mobileCopy(session.language, "whatsappReady"));
    } catch {
      setMessage(mobileCopy(session.language, "whatsappFailed"));
    }
  }

  function openOrderSheet() {
    setQuantity(String(currentProduct.moq));
    setOrderError("");
    setOrderSheetOpen(true);
  }

  function continueToOrderFlow() {
    const nextQuantity = Number(quantity);
    if (!fullName.trim() || !whatsappPhone.trim()) {
      setOrderError(mobileCopy(session.language, "orderDetailsRequired"));
      return;
    }
    if (!Number.isFinite(nextQuantity) || nextQuantity < currentProduct.moq) {
      setOrderError(mobileCopy(session.language, "quantityBelowMoq").replace("{{moq}}", String(currentProduct.moq)));
      return;
    }

    setOrderError("");
    setOrderSheetOpen(false);
    if (!primaryVariant) {
      const url = buildWhatsappOrderUrl({
        businessName: session.user?.businessName,
        fullName: fullName.trim(),
        whatsappPhone: whatsappPhone.trim(),
        gstNumber: gstNumber.trim(),
        productTitle: currentProduct.title,
        productImageUrl: imageUrls[0],
        quantity: nextQuantity,
        moq: currentProduct.moq,
        unitPrice: currentProduct.baseWholesalePrice,
      });
      void Linking.openURL(url)
        .then(() => setMessage(mobileCopy(session.language, "whatsappReady")))
        .catch(() => setMessage(mobileCopy(session.language, "whatsappFailed")));
      return;
    }

    router.push({
      pathname: "/(app)/checkout",
      params: {
        productId: currentProduct.id,
        productTitle: currentProduct.title,
        productImage: imageUrls[0],
        variantId: primaryVariant?.id ?? "",
        moq: String(currentProduct.moq),
        unitPrice: String(currentProduct.baseWholesalePrice),
        quantity: String(nextQuantity),
        fullName: fullName.trim(),
        whatsappPhone: whatsappPhone.trim(),
        gstNumber: gstNumber.trim(),
      },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} stickyHeaderIndices={[0]}>
        <View style={styles.stickyWrap}>
          <BuyerTopBar
            name={mobileCopy(session.language, "appName")}
            tagline={mobileCopy(session.language, "brandTagline")}
            onOpenMenu={() => setDrawerOpen(true)}
          />
        </View>

        <FashionImageCarousel imageUrls={imageUrls} aspectRatio={3 / 4} />

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{currentProduct.category.replace("_", " ")}</Text>
          <Text style={styles.title}>{currentProduct.title}</Text>
          <Text style={styles.subtitle}>{currentProduct.description || mobileCopy(session.language, "productDetailFallbackSubtitle")}</Text>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.price}>
            ₹{currentProduct.baseWholesalePrice} {mobileCopy(session.language, "wholesalePriceSuffix")}
          </Text>
          <Text style={styles.meta}>MOQ {currentProduct.moq} · {currentProduct.availabilityStatus.replace("_", " ")}</Text>
        </View>

        <View style={styles.variantCard}>
          <Text style={styles.sectionTitle}>{mobileCopy(session.language, "availableSizes")}</Text>
          {availableSizes.length > 0 ? (
            <View style={styles.chipRow}>
              {availableSizes.map((sizeLabel) => (
                <View key={sizeLabel} style={styles.sizeChip}>
                  <Text style={styles.sizeChipText}>{sizeLabel}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.error}>{mobileCopy(session.language, "noVariantAvailable")}</Text>
          )}
        </View>

        <View style={styles.variantCard}>
          <Text style={styles.sectionTitle}>{mobileCopy(session.language, "availableVariant")}</Text>
          {primaryVariant ? (
            <Text style={styles.meta}>
              {primaryVariant.sizeLabel}
              {primaryVariant.colorLabel ? ` · ${primaryVariant.colorLabel}` : ""} · {primaryVariant.availabilityStatus.replace("_", " ")}
            </Text>
          ) : (
            <Text style={styles.meta}>{mobileCopy(session.language, "whatsappOrderingBody")}</Text>
          )}
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{mobileCopy(session.language, "whatsappOrderingTitle")}</Text>
          <Text style={styles.noticeBody}>{mobileCopy(session.language, "whatsappOrderingBody")}</Text>
        </View>

        {message ? <Text style={styles.success}>{message}</Text> : null}

        <View style={styles.actionRow}>
          <Pressable accessibilityRole="button" onPress={() => void sendOrderToWhatsapp()} style={({ pressed }) => [styles.whatsappButton, pressed && styles.whatsappButtonPressed]}>
            <View style={styles.whatsappButtonRow}>
              <Text style={styles.whatsappIcon}>W</Text>
              <View style={styles.whatsappCopy}>
                <Text style={styles.whatsappLabel}>{mobileCopy(session.language, "contactOnWhatsapp")}</Text>
                <Text style={styles.whatsappHint}>{mobileCopy(session.language, "openWhatsappChat")}</Text>
              </View>
            </View>
          </Pressable>
          <ActionButton label={mobileCopy(session.language, "orderNow")} onPress={openOrderSheet} />
        </View>
      </ScrollView>

      <BuyerAccountDrawer
        language={session.language}
        onArrivalAlerts={() => {
          setMessage(mobileCopy(session.language, "checkingNotificationReadiness"));
          notifications
            .getReadiness()
            .then((readiness) =>
              setMessage(readiness.ready ? mobileCopy(session.language, "relevantAlertsReady") : readiness.reason.replace("_", " ")),
            )
            .catch(() => setMessage(mobileCopy(session.language, "unableToCheckNotificationReadiness")));
        }}
        onClose={() => setDrawerOpen(false)}
        onLanguage={() => router.push("/(app)/language")}
        onOrders={() => router.push("/(app)/orders")}
        onRefresh={() => router.replace("/(app)")}
        onSignOut={() => {
          sessionStore.signOut();
          router.replace("/(auth)");
        }}
        user={session.user}
        visible={drawerOpen}
      />

      <Modal animationType="slide" onRequestClose={() => setOrderSheetOpen(false)} transparent visible={orderSheetOpen}>
        <View style={styles.sheetOverlay}>
          <Pressable onPress={() => setOrderSheetOpen(false)} style={styles.sheetBackdrop} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{mobileCopy(session.language, "orderDetailsTitle")}</Text>
            <Text style={styles.sheetSubtitle}>{mobileCopy(session.language, "orderDetailsSubtitle")}</Text>

            <Text style={styles.label}>{mobileCopy(session.language, "quantity")}</Text>
            <TextInput keyboardType="number-pad" onChangeText={setQuantity} style={styles.input} value={quantity || minimumOrderQuantity} />

            <Text style={styles.label}>{mobileCopy(session.language, "fullName")}</Text>
            <TextInput onChangeText={setFullName} style={styles.input} value={fullName} />

            <Text style={styles.label}>{mobileCopy(session.language, "whatsappPhoneNumber")}</Text>
            <TextInput keyboardType="phone-pad" onChangeText={setWhatsappPhone} style={styles.input} value={whatsappPhone} />

            <Text style={styles.label}>{mobileCopy(session.language, "gstNumberOptional")}</Text>
            <TextInput autoCapitalize="characters" onChangeText={setGstNumber} style={styles.input} value={gstNumber} />

            {orderError ? <Text style={styles.error}>{orderError}</Text> : null}
            <ActionButton label={primaryVariant ? mobileCopy(session.language, "continueOrder") : mobileCopy(session.language, "sendViaWhatsapp")} onPress={continueToOrderFlow} />
            <ActionButton label={mobileCopy(session.language, "backToCatalog")} onPress={() => setOrderSheetOpen(false)} variant="secondary" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  stickyWrap: {
    marginHorizontal: -18,
    marginTop: -2,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 246, 251, 0.96)",
  },
  fallbackWrap: {
    gap: 10,
    padding: 24,
  },
  fallbackTitle: {
    color: mobileTheme.ink,
    fontSize: 32,
    fontWeight: "900",
  },
  fallbackSubtitle: {
    color: mobileTheme.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroCard: {
    gap: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 30,
    backgroundColor: mobileTheme.card,
    padding: 20,
    shadowColor: mobileTheme.shadow,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 3,
  },
  eyebrow: {
    color: mobileTheme.primaryDeep,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  title: {
    color: mobileTheme.ink,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.4,
    lineHeight: 38,
  },
  subtitle: {
    color: mobileTheme.muted,
    fontSize: 15,
    lineHeight: 22,
  },
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
  actionRow: {
    gap: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sizeChip: {
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 999,
    backgroundColor: mobileTheme.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sizeChipText: {
    color: mobileTheme.ink,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,
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
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(45, 18, 48, 0.18)",
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheet: {
    gap: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: mobileTheme.card,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 30,
  },
  sheetTitle: {
    color: mobileTheme.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  sheetSubtitle: {
    color: mobileTheme.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  label: {
    color: mobileTheme.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 6,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 18,
    backgroundColor: mobileTheme.cardAlt,
    color: mobileTheme.ink,
    paddingHorizontal: 14,
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
