import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ProductCard } from "@pet-slay/types";

import { ActionButton } from "../../src/components/ActionButton";
import { BrandMark } from "../../src/components/BrandMark";
import { FashionImageCarousel } from "../../src/components/FashionImageCarousel";
import { mobileTheme, Screen } from "../../src/components/Screen";
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
      <Screen title={mobileCopy(session.language, "preparingCatalog")} subtitle={mobileCopy(session.language, "preparingCatalogSubtitle")}>
        <Text style={styles.muted}>{mobileCopy(session.language, "pleaseWait")}</Text>
      </Screen>
    );
  }

  return (
    <Screen
      eyebrow={session.user?.businessName ?? mobileCopy(session.language, "resellerCatalog")}
      title={mobileCopy(session.language, "resellerWelcome")}
      subtitle={mobileCopy(session.language, "catalogSubtitle")}
    >
      <BrandMark name={mobileCopy(session.language, "appName")} tagline={mobileCopy(session.language, "brandTagline")} />
      <View style={styles.toolbar}>
        <Link href="/(app)/language" asChild>
          <Pressable style={styles.tile}>
            <Text style={styles.tileLabel}>{mobileCopy(session.language, "language")}</Text>
            <Text style={styles.tileValue}>{session.language}</Text>
          </Pressable>
        </Link>
        <Link href="/(app)/orders" asChild>
          <Pressable style={styles.tile}>
            <Text style={styles.tileLabel}>{mobileCopy(session.language, "orders")}</Text>
            <Text style={styles.tileValue}>{mobileCopy(session.language, "history")}</Text>
          </Pressable>
        </Link>
        <ActionButton label={mobileCopy(session.language, "refreshCatalog")} variant="secondary" onPress={() => router.replace("/(app)")} />
        <ActionButton
          label={mobileCopy(session.language, "signOut")}
          variant="secondary"
          onPress={() => {
            sessionStore.signOut();
            router.replace("/(auth)");
          }}
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
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    minWidth: 128,
    flex: 1,
    gap: 6,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 22,
    backgroundColor: mobileTheme.cardAlt,
    padding: 16,
  },
  tileLabel: {
    color: mobileTheme.primaryDeep,
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
  error: {
    color: mobileTheme.danger,
    fontWeight: "700",
  },
});
