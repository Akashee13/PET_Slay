import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Order } from "@pet-slay/types";

import { mobileTheme, Screen } from "../../../src/components/Screen";
import type { RefundDecision } from "../../../src/services/buyer-api";
import { useBuyerApp } from "../../../src/state/buyer-app-context";

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { notifications, orders, refunds: refundController } = useBuyerApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [refunds, setRefunds] = useState<RefundDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      return;
    }

    setLoading(true);
    setError("");
    Promise.all([orders.loadOrderDetail(orderId), orders.loadRefunds(orderId)])
      .then(([nextOrder, nextRefunds]) => {
        setOrder(nextOrder);
        setRefunds(nextRefunds);
      })
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "order_load_failed"))
      .finally(() => setLoading(false));
  }, [orderId, orders]);

  return (
    <Screen eyebrow="Order detail" title={orderId || "Order"} subtitle="Refunds default to store credit unless admin approves a source-payment exception.">
      {loading && <Text style={styles.muted}>Loading order...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      {order && (
        <View style={styles.card}>
          <Text style={styles.title}>Status: {order.status}</Text>
          <Text style={styles.meta}>Total: ₹{order.totalAmount}</Text>
          <Text style={styles.meta}>Items: {order.items.length}</Text>
          <Text style={styles.meta}>Deep link: {notifications.buildOrderDeepLink(order.id)}</Text>
        </View>
      )}
      <View style={styles.card}>
        <Text style={styles.title}>Refund decisions</Text>
        {refunds.length === 0 && (
          <View style={styles.refundRow}>
            <Text style={styles.meta}>{refundController.describeDecision().headline}</Text>
            <Text style={styles.muted}>{refundController.describeDecision().detail}</Text>
          </View>
        )}
        {refunds.map((refund) => (
          <View key={refund.id} style={styles.refundRow}>
            <Text style={styles.meta}>{refundController.describeDecision(refund).headline}</Text>
            <Text style={styles.muted}>{refundController.describeDecision(refund).detail}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
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
    textTransform: "capitalize",
  },
  meta: {
    color: mobileTheme.muted,
    fontSize: 15,
    textTransform: "capitalize",
  },
  refundRow: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.line,
    paddingTop: 10,
  },
  muted: {
    color: mobileTheme.muted,
  },
  error: {
    color: mobileTheme.danger,
    fontWeight: "800",
  },
});
