import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Order } from "@pet-slay/types";

import { mobileTheme, Screen } from "../../../src/components/Screen";
import { useBuyerApp } from "../../../src/state/buyer-app-context";

export default function OrdersScreen() {
  const { orders } = useBuyerApp();
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    orders
      .loadOrderHistory()
      .then(setItems)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "orders_load_failed"))
      .finally(() => setLoading(false));
  }, [orders]);

  return (
    <Screen eyebrow="Buyer orders" title="Order history" subtitle="Track wholesale orders and refund decisions from one place.">
      {loading && <Text style={styles.muted}>Loading orders...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && items.length === 0 && <Text style={styles.muted}>No orders placed yet.</Text>}
      <View style={styles.list}>
        {items.map((order) => (
          <Link key={order.id} href={`/(app)/orders/${order.id}`} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.title}>{order.id}</Text>
              <Text style={styles.meta}>Status: {order.status}</Text>
              <Text style={styles.meta}>Total: ₹{order.totalAmount}</Text>
              <Text style={styles.cta}>View refund status</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    gap: 6,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 22,
    backgroundColor: mobileTheme.card,
    padding: 16,
  },
  title: {
    color: mobileTheme.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  meta: {
    color: mobileTheme.muted,
    fontSize: 14,
    textTransform: "capitalize",
  },
  cta: {
    color: mobileTheme.primary,
    fontWeight: "900",
  },
  muted: {
    color: mobileTheme.muted,
  },
  error: {
    color: mobileTheme.danger,
    fontWeight: "800",
  },
});

