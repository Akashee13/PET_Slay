const WHATSAPP_PHONE = "918292349038";

export function buildWhatsappOrderUrl(input: {
  businessName?: string;
  fullName?: string;
  whatsappPhone?: string;
  gstNumber?: string;
  productTitle: string;
  productImageUrl?: string;
  quantity: number;
  moq: number;
  city?: string;
  unitPrice: number;
}) {
  const lines = [
    `Hello Noira team, I want to place a reseller order.`,
    input.businessName ? `Buyer: ${input.businessName}` : undefined,
    input.fullName ? `Full name: ${input.fullName}` : undefined,
    input.whatsappPhone ? `WhatsApp number: ${input.whatsappPhone}` : undefined,
    input.gstNumber ? `GST number: ${input.gstNumber}` : undefined,
    `Product: ${input.productTitle}`,
    `Required quantity: ${input.quantity}`,
    input.moq > 0 ? `MOQ: ${input.moq}` : undefined,
    input.city ? `Delivery city: ${input.city}` : undefined,
    `Base wholesale price: INR ${input.unitPrice}`,
    input.productImageUrl ? `Product image: ${input.productImageUrl}` : undefined,
  ].filter(Boolean);

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(lines.join("\n"))}`;
}
