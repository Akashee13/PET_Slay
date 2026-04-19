export type Language = "english" | "hindi" | "hinglish";

export type Role = "buyer" | "admin";

export type ProductCategory = "western" | "south_asian";

export type AvailabilityStatus = "in_stock" | "low_stock" | "out_of_stock";

export type CampaignType = "new_arrival" | "trending" | "restock";

export type RefundDecisionType = "store_credit" | "payment_source";

export interface CurrentUser {
  id: string;
  role: Role;
  email: string;
  preferredLanguage: Language;
  businessName?: string;
}

export interface ProductCard {
  id: string;
  title: string;
  category: ProductCategory;
  baseWholesalePrice: number;
  moq: number;
  availabilityStatus: AvailabilityStatus;
  isNewArrival: boolean;
  coverImageUrl?: string;
  imageUrls?: string[];
}

export interface ProductVariant {
  id: string;
  sizeLabel: string;
  colorLabel?: string;
  availabilityStatus: AvailabilityStatus;
}

export interface ProductDetail extends ProductCard {
  description?: string;
  sizeChart?: Record<string, unknown>;
  variants: ProductVariant[];
}

export interface OrderLineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  productVariantId?: string;
}

export interface Order {
  id: string;
  status: string;
  totalAmount: number;
  items: OrderLineItem[];
  refundPolicy?: {
    defaultMode: "store_credit";
    adminExceptionAllowed: boolean;
  };
}
