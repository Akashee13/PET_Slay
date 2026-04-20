import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ProductCard } from "@pet-slay/types";

import { ActionButton } from "../../src/components/ActionButton";
import { mobileTheme, Screen } from "../../src/components/Screen";
import { getPrimaryProductImage } from "../../src/features/catalog/product-images";
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
      <Screen title="Preparing your catalog" subtitle="Checking reseller session and loading fresh arrivals.">
        <Text style={styles.muted}>Please wait...</Text>
      </Screen>
    );
  }

  return (
    <Screen
      eyebrow={session.user?.businessName ?? "Reseller catalog"}
      title={mobileCopy(session.language, "resellerWelcome")}
      subtitle={mobileCopy(session.language, "catalogSubtitle")}
    >
      <View style={styles.toolbar}>
        <Link href="/(app)/language" asChild>
          <Pressable style={styles.tile}>
            <Text style={styles.tileLabel}>Language</Text>
            <Text style={styles.tileValue}>{session.language}</Text>
          </Pressable>
        </Link>
        <Link href="/(app)/orders" asChild>
          <Pressable style={styles.tile}>
            <Text style={styles.tileLabel}>{mobileCopy(session.language, "orders")}</Text>
            <Text style={styles.tileValue}>History</Text>
          </Pressable>
        </Link>
        <ActionButton label={mobileCopy(session.language, "refreshCatalog")} variant="secondary" onPress={() => router.replace("/(app)")} />
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
            setNotificationStatus("Checking notification readiness...");
            notifications
              .getReadiness()
              .then((readiness) => setNotificationStatus(readiness.ready ? "Ready for relevant alerts." : readiness.reason.replace("_", " ")))
              .catch(() => setNotificationStatus("Unable to check right now."));
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
              <Image source={{ uri: getPrimaryProductImage(product) }} style={styles.productImage} />
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
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 22,
    backgroundColor: "#fff7ed",
    padding: 14,
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
    color: mobileTheme.primary,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
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
