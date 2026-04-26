import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../../src/components/ActionButton";
import { mobileTheme, Screen } from "../../src/components/Screen";
import { formatInr, formatOrderStatus } from "../../src/features/orders/order-presenter";
import { buildWhatsappOrderUrl } from "../../src/features/orders/whatsapp-order";
import { mobileCopy } from "../../src/i18n";
import { useBuyerApp, useSessionSnapshot } from "../../src/state/buyer-app-context";

export default function CheckoutScreen() {
  const router = useRouter();
  const { orders } = useBuyerApp();
  const session = useSessionSnapshot();
  const params = useLocalSearchParams<{
    productId: string;
    productTitle: string;
    productImage: string;
    variantId: string;
    unitPrice: string;
    quantity: string;
    fullName: string;
    whatsappPhone: string;
    gstNumber: string;
  }>();
  const unitPrice = Number(params.unitPrice || "0");
  const [quantity, setQuantity] = useState(params.quantity || "1");
  const [fullName, setFullName] = useState(params.fullName || "");
  const [whatsappPhone, setWhatsappPhone] = useState(params.whatsappPhone || "");
  const [gstNumber, setGstNumber] = useState(params.gstNumber || "");
  const [city, setCity] = useState("Delhi");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState("");

  async function submitOrder() {
    const nextQuantity = Number(quantity);
    setMessage("");
    try {
      if (!fullName.trim() || !whatsappPhone.trim()) {
        throw new Error("order_details_required");
      }
      orders.validateWholesaleQuantity({ quantity: nextQuantity });
      setSubmitting(true);
      const order = await orders.submitOrder({
        productVariantId: params.variantId,
        quantity: nextQuantity,
        shippingAddress: {
          city,
          fullName: fullName.trim(),
          whatsappPhone: whatsappPhone.trim(),
          gstNumber: gstNumber.trim() || undefined,
        },
        notes: [`Buyer name: ${fullName.trim()}`, `WhatsApp: ${whatsappPhone.trim()}`, gstNumber.trim() ? `GST: ${gstNumber.trim()}` : undefined]
          .filter(Boolean)
          .join(" · "),
      });
      setCreatedOrderId(order.id);
      setMessage(`${mobileCopy(session.language, "orderCreated")}: ${order.id} · ${mobileCopy(session.language, "status")}: ${formatOrderStatus(order.status)}`);
    } catch (requestError) {
      setMessage(
        requestError instanceof Error && requestError.message === "quantity_invalid"
          ? mobileCopy(session.language, "quantityMustBePositive")
          : requestError instanceof Error && requestError.message === "order_details_required"
            ? mobileCopy(session.language, "orderDetailsRequired")
            : requestError instanceof Error
              ? requestError.message
              : "order_submit_failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function sendOrderToWhatsapp() {
    try {
      if (!fullName.trim() || !whatsappPhone.trim()) {
        throw new Error("order_details_required");
      }
      const url = buildWhatsappOrderUrl({
        businessName: session.user?.businessName,
        fullName: fullName.trim(),
        whatsappPhone: whatsappPhone.trim(),
        gstNumber: gstNumber.trim(),
        productTitle: params.productTitle || mobileCopy(session.language, "createOrder"),
        productImageUrl: params.productImage || "",
        quantity: Number(quantity || 0),
        city,
        unitPrice,
      });
      await Linking.openURL(url);
      setMessage(mobileCopy(session.language, "whatsappReady"));
    } catch (requestError) {
      setMessage(
        requestError instanceof Error && requestError.message === "order_details_required"
          ? mobileCopy(session.language, "orderDetailsRequired")
          : mobileCopy(session.language, "whatsappFailed"),
      );
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
        <Text style={styles.summaryLine}>{mobileCopy(session.language, "estimatedTotal")} {formatInr(Number(quantity || 0) * unitPrice)}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>{mobileCopy(session.language, "quantity")}</Text>
        <TextInput keyboardType="number-pad" onChangeText={setQuantity} style={styles.input} value={quantity} />
        <Text style={styles.label}>{mobileCopy(session.language, "fullName")}</Text>
        <TextInput onChangeText={setFullName} style={styles.input} value={fullName} />
        <Text style={styles.label}>{mobileCopy(session.language, "whatsappPhoneNumber")}</Text>
        <TextInput keyboardType="phone-pad" onChangeText={setWhatsappPhone} style={styles.input} value={whatsappPhone} />
        <Text style={styles.label}>{mobileCopy(session.language, "gstNumberOptional")}</Text>
        <TextInput autoCapitalize="characters" onChangeText={setGstNumber} style={styles.input} value={gstNumber} />
        <Text style={styles.label}>{mobileCopy(session.language, "deliveryCity")}</Text>
        <TextInput onChangeText={setCity} style={styles.input} value={city} />
      </View>

      {message && <Text style={message.startsWith("Order") ? styles.success : styles.error}>{message}</Text>}
      {createdOrderId && (
        <Link href={`/(app)/orders/${createdOrderId}`} asChild>
          <ActionButton label={mobileCopy(session.language, "viewOrderRefundStatus")} variant="secondary" />
        </Link>
      )}
      <ActionButton label={mobileCopy(session.language, "sendViaWhatsapp")} variant="secondary" onPress={() => void sendOrderToWhatsapp()} />
      <ActionButton
        disabled={!params.variantId}
        loading={submitting}
        label={submitting ? mobileCopy(session.language, "placingOrder") : mobileCopy(session.language, "placeWholesaleOrder")}
        onPress={() => void submitOrder()}
      />
      <ActionButton label={mobileCopy(session.language, "backToCatalog")} variant="secondary" onPress={() => router.replace("/(app)")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    gap: 6,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 24,
    backgroundColor: mobileTheme.cardAlt,
    padding: 18,
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
    minHeight: 52,
    borderWidth: 1,
    borderColor: mobileTheme.line,
    borderRadius: 18,
    backgroundColor: mobileTheme.card,
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
