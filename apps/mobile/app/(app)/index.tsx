import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ProductCard } from "@pet-slay/types";

import { ActionButton } from "../../src/components/ActionButton";
import { BuyerAccountDrawer } from "../../src/components/BuyerAccountDrawer";
import { BuyerTopBar } from "../../src/components/BuyerTopBar";
import { FashionImageCarousel } from "../../src/components/FashionImageCarousel";
import { mobileTheme } from "../../src/components/Screen";
import { getProductImageUrls } from "../../src/features/catalog/product-images";
import { mobileCopy } from "../../src/i18n";
import { useBuyerApp, useSessionSnapshot } from "../../src/state/buyer-app-context";

export default function CatalogScreen() {
  const router = useRouter();
  const { api, catalog, notifications, sessionStore } = useBuyerApp();
  const session = useSessionSnapshot();
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notificationStatus, setNotificationStatus] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      .loadProducts({ language: session.language })
      .then(setProducts)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "catalog_load_failed"))
      .finally(() => setLoading(false));
  }, [catalog, router, session.language, session.status]);

  if (session.status !== "authenticated") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.loadingTitle}>{mobileCopy(session.language, "preparingCatalog")}</Text>
          <Text style={styles.muted}>{mobileCopy(session.language, "preparingCatalogSubtitle")}</Text>
          <Text style={styles.muted}>{mobileCopy(session.language, "pleaseWait")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} stickyHeaderIndices={[3]}>
        <View pointerEvents="none" style={styles.heroGlowPrimary} />
        <View pointerEvents="none" style={styles.heroGlowSecondary} />

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{session.user?.businessName ?? mobileCopy(session.language, "resellerCatalog")}</Text>
          <Text style={styles.title}>{mobileCopy(session.language, "resellerWelcome")}</Text>
          <Text style={styles.subtitle}>{mobileCopy(session.language, "catalogSubtitle")}</Text>
        </View>

        <View style={styles.stickyWrap}>
          <BuyerTopBar
            name={mobileCopy(session.language, "appName")}
            tagline={mobileCopy(session.language, "brandTagline")}
            onOpenMenu={() => setDrawerOpen(true)}
          />
        </View>

        <View style={styles.notice}>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>{mobileCopy(session.language, "arrivalAlerts")}</Text>
            <Text style={styles.noticeText}>{mobileCopy(session.language, "arrivalAlertsBody")}</Text>
            {notificationStatus && <Text style={styles.noticeStatus}>{notificationStatus}</Text>}
          </View>
          <ActionButton
            label={mobileCopy(session.language, "checkReadiness")}
            variant="secondary"
            onPress={() => {
              setNotificationStatus(mobileCopy(session.language, "checkingNotificationReadiness"));
              notifications
                .getReadiness()
                .then((readiness) =>
                  setNotificationStatus(
                    readiness.ready ? mobileCopy(session.language, "relevantAlertsReady") : readiness.reason.replace("_", " "),
                  ),
                )
                .catch(() => setNotificationStatus(mobileCopy(session.language, "unableToCheckNotificationReadiness")));
            }}
          />
        </View>

        {loading && <Text style={styles.muted}>{mobileCopy(session.language, "loadingProducts")}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
        {!loading && products.length === 0 && <Text style={styles.muted}>{mobileCopy(session.language, "noProducts")}</Text>}

        <View style={styles.grid}>
          {products.map((product) => (
            <Link key={product.id} href={`/(app)/products/${product.id}`} asChild>
              <Pressable style={styles.productCard}>
                <FashionImageCarousel imageUrls={getProductImageUrls(product)} />
                <View style={styles.productBody}>
                  <Text style={styles.category}>{product.category.replace("_", " ")}</Text>
                  <Text style={styles.productTitle}>{product.title}</Text>
                  <Text style={styles.price}>
                    {`₹${product.baseWholesalePrice} wholesale${product.moq > 0 ? ` · MOQ ${product.moq}` : ""}`}
                  </Text>
                  <Text style={styles.status}>{product.availabilityStatus.replace("_", " ")}</Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>

      <BuyerAccountDrawer
        language={session.language}
        onArrivalAlerts={() => {
          setNotificationStatus(mobileCopy(session.language, "checkingNotificationReadiness"));
          notifications
            .getReadiness()
            .then((readiness) =>
              setNotificationStatus(readiness.ready ? mobileCopy(session.language, "relevantAlertsReady") : readiness.reason.replace("_", " ")),
            )
            .catch(() => setNotificationStatus(mobileCopy(session.language, "unableToCheckNotificationReadiness")));
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
  loadingTitle: {
    color: mobileTheme.ink,
    fontSize: 32,
    fontWeight: "900",
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
  stickyWrap: {
    marginHorizontal: -18,
    marginTop: -2,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 246, 251, 0.96)",
  },
  grid: {
    gap: 16,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 26,
    backgroundColor: mobileTheme.cardAlt,
    padding: 16,
  },
  noticeCopy: {
    flex: 1,
    gap: 4,
  },
  noticeTitle: {
    color: mobileTheme.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  noticeText: {
    color: mobileTheme.muted,
    fontSize: 13,
  },
  noticeStatus: {
    color: mobileTheme.primaryDeep,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  productCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 28,
    backgroundColor: mobileTheme.card,
    shadowColor: mobileTheme.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
  },
  productBody: {
    gap: 6,
    padding: 14,
  },
  category: {
    color: mobileTheme.primaryDeep,
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
    backgroundColor: "#dbf6e3",
    color: mobileTheme.sage,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: "capitalize",
  },
  muted: {
    color: mobileTheme.muted,
  },
  heroGlowPrimary: {
    position: "absolute",
    right: -10,
    top: 10,
    height: 150,
    width: 150,
    borderRadius: 999,
    backgroundColor: mobileTheme.accentSoft,
  },
  heroGlowSecondary: {
    position: "absolute",
    left: -30,
    top: 120,
    height: 110,
    width: 110,
    borderRadius: 999,
    backgroundColor: mobileTheme.lavender,
    opacity: 0.8,
  },
  error: {
    color: mobileTheme.danger,
    fontWeight: "700",
  },
});
