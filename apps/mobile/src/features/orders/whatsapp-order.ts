const WHATSAPP_PHONE = "918292349038";

export function buildWhatsappOrderUrl(input: {
  businessName?: string;
  productTitle: string;
  productImageUrl?: string;
  quantity: number;
  moq: number;
  city: string;
  unitPrice: number;
}) {
  const lines = [
    `Hello Noira team, I want to place a reseller order.`,
    input.businessName ? `Buyer: ${input.businessName}` : undefined,
    `Product: ${input.productTitle}`,
    `Required quantity: ${input.quantity}`,
    `MOQ: ${input.moq}`,
    `Delivery city: ${input.city}`,
    `Base wholesale price: INR ${input.unitPrice}`,
    input.productImageUrl ? `Product image: ${input.productImageUrl}` : undefined,
  ].filter(Boolean);

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(lines.join("\n"))}`;
}
