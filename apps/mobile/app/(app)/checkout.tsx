import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../../src/components/ActionButton";
import { mobileTheme, Screen } from "../../src/components/Screen";
import { mobileCopy } from "../../src/i18n";
import { useBuyerApp, useSessionSnapshot } from "../../src/state/buyer-app-context";

export default function CheckoutScreen() {
  const router = useRouter();
  const { orders } = useBuyerApp();
  const session = useSessionSnapshot();
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
  const [createdOrderId, setCreatedOrderId] = useState("");

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
      setCreatedOrderId(order.id);
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
      eyebrow={mobileCopy(session.language, "wholesaleCheckout")}
      title={params.productTitle || mobileCopy(session.language, "createOrder")}
      subtitle={mobileCopy(session.language, "checkoutSubtitle")}
    >
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{mobileCopy(session.language, "orderSummary")}</Text>
        <Text style={styles.summaryLine}>MOQ {moq}</Text>
        <Text style={styles.summaryLine}>Estimated total ₹{Number(quantity || 0) * unitPrice}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>{mobileCopy(session.language, "quantity")}</Text>
        <TextInput keyboardType="number-pad" onChangeText={setQuantity} style={styles.input} value={quantity} />
        <Text style={styles.label}>{mobileCopy(session.language, "deliveryCity")}</Text>
        <TextInput onChangeText={setCity} style={styles.input} value={city} />
      </View>

      {message && <Text style={message.startsWith("Order") ? styles.success : styles.error}>{message}</Text>}
      {createdOrderId && (
        <Link href={`/(app)/orders/${createdOrderId}`} asChild>
          <ActionButton label={mobileCopy(session.language, "viewOrderRefundStatus")} variant="secondary" />
        </Link>
      )}
      <ActionButton disabled={submitting || !params.variantId} label={submitting ? mobileCopy(session.language, "placingOrder") : mobileCopy(session.language, "placeWholesaleOrder")} onPress={() => void submitOrder()} />
      <ActionButton label={mobileCopy(session.language, "backToCatalog")} variant="secondary" onPress={() => router.replace("/(app)")} />
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
