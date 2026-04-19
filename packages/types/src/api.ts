import type { CampaignType, Language, Order, ProductCard, ProductDetail } from "./domain";

export interface UpdateLanguageRequest {
  preferredLanguage: Language;
}

export interface CatalogProductsResponse {
  items: ProductCard[];
}

export interface UpdateLanguageResponse {
  id: string;
  role: "buyer";
  email: string;
  preferredLanguage: Language;
  businessName?: string;
}

export interface CreateOrderRequest {
  items: Array<{
    productVariantId: string;
    quantity: number;
  }>;
  shippingAddress: Record<string, unknown>;
  notes?: string;
}

export interface CreateProductRequest {
  title: string;
  category: "western" | "south_asian";
  description?: string;
  baseWholesalePrice: number;
  moq: number;
  availabilityStatus?: "in_stock" | "low_stock" | "out_of_stock";
  imageUrls?: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  isNewArrival?: boolean;
}

export interface CreateCampaignRequest {
  campaignType: CampaignType;
  audienceRule?: Record<string, unknown>;
  messageVariants: Array<{
    language: Language;
    title: string;
    body: string;
  }>;
  productIds: string[];
}

export interface UpdateRefundDecisionRequest {
  status: "approved" | "rejected";
  decisionType?: "store_credit" | "payment_source";
  reasonCode?: string;
  adminNotes?: string;
}

export interface ApiContractMap {
  currentUser: {
    response: import("./domain").CurrentUser;
  };
  updateLanguage: {
    request: UpdateLanguageRequest;
    response: UpdateLanguageResponse;
  };
  catalogProducts: {
    response: CatalogProductsResponse;
  };
  productDetail: {
    response: ProductDetail;
  };
  createOrder: {
    request: CreateOrderRequest;
    response: Order;
  };
  orderDetail: {
    response: Order;
  };
}
