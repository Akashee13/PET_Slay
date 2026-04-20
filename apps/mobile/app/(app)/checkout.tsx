import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../../src/components/ActionButton";
import { mobileTheme, Screen } from "../../src/components/Screen";
import { useBuyerApp } from "../../src/state/buyer-app-context";

export default function CheckoutScreen() {
  const router = useRouter();
  const { orders } = useBuyerApp();
  const params = useLocalSearchParams<{
    productId: string;
    productTitle: string;
    variantId: string;
    moq: string;
    unitPrice: string;
  }>();
  const moq = Number(params.moq || "0");
  const unitPrice = Number(params.unitPrice || "0");
  const [quantity, setQuantity] = useState(params.moq || "");
  const [city, setCity] = useState("Delhi");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submitOrder() {
    const nextQuantity = Number(quantity);
    setMessage("");
    try {
      orders.validateWholesaleQuantity({ quantity: nextQuantity, moq });
      setSubmitting(true);
      const order = await orders.submitOrder({
        productVariantId: params.variantId,
        quantity: nextQuantity,
        shippingAddress: { city },
      });
      setMessage(`Order ${order.id} created. Status: ${order.status}`);
    } catch (requestError) {
      setMessage(requestError instanceof Error && requestError.message === "quantity_below_moq"
        ? `Quantity must be at least MOQ ${moq}.`
        : requestError instanceof Error ? requestError.message : "order_submit_failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      eyebrow="Wholesale checkout"
      title={params.productTitle || "Create order"}
      subtitle="Confirm MOQ and delivery city before placing the reseller order."
    >
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Order summary</Text>
        <Text style={styles.summaryLine}>MOQ {moq}</Text>
        <Text style={styles.summaryLine}>Estimated total ₹{Number(quantity || 0) * unitPrice}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Quantity</Text>
        <TextInput keyboardType="number-pad" onChangeText={setQuantity} style={styles.input} value={quantity} />
        <Text style={styles.label}>Delivery city</Text>
        <TextInput onChangeText={setCity} style={styles.input} value={city} />
      </View>

      {message && <Text style={message.startsWith("Order") ? styles.success : styles.error}>{message}</Text>}
      <ActionButton disabled={submitting || !params.variantId} label={submitting ? "Placing order..." : "Place wholesale order"} onPress={() => void submitOrder()} />
      <ActionButton label="Back to catalog" variant="secondary" onPress={() => router.replace("/(app)")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    gap: 6,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 22,
    backgroundColor: mobileTheme.card,
    padding: 16,
  },
  summaryTitle: {
    color: mobileTheme.ink,
    fontSize: 19,
    fontWeight: "900",
  },
  summaryLine: {
    color: mobileTheme.muted,
    fontSize: 15,
  },
  form: {
    gap: 8,
  },
  label: {
    color: mobileTheme.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 14,
    backgroundColor: "#fff",
    color: mobileTheme.ink,
    paddingHorizontal: 14,
  },
  success: {
    color: mobileTheme.sage,
    fontWeight: "900",
  },
  error: {
    color: mobileTheme.danger,
    fontWeight: "900",
  },
});
