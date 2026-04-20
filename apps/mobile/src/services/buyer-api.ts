import type {
  CatalogProductsResponse,
  CreateOrderRequest,
  UpdateLanguageRequest,
  UpdateLanguageResponse,
} from "@pet-slay/types";
import type { CurrentUser, Order, ProductDetail } from "@pet-slay/types";

const DEFAULT_API_BASE_URL = "https://pet-slay-api-stage-j67sekma7a-el.a.run.app";

export type ApiTransport = (path: string, init: RequestInit) => Promise<unknown>;

export type BuyerApiClientOptions = {
  baseUrl?: string;
  getToken: () => string | null;
  transport?: ApiTransport;
};

export type RefundDecision = {
  id: string;
  orderId: string;
  buyerId: string;
  status: string;
  decisionType: "store_credit" | "payment_source";
  reasonCode?: string;
  adminNotes?: string;
};

function getMobileApiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export class BuyerApiClient {
  private readonly baseUrl: string;
  private readonly getToken: () => string | null;
  private readonly transport?: ApiTransport;

  constructor(options: BuyerApiClientOptions) {
    this.baseUrl = (options.baseUrl ?? getMobileApiBaseUrl()).replace(/\/$/, "");
    this.getToken = options.getToken;
    this.transport = options.transport;
  }

  async currentUser(): Promise<CurrentUser> {
    return this.request<CurrentUser>("/v1/me");
  }

  async updateLanguage(preferredLanguage: UpdateLanguageRequest["preferredLanguage"]): Promise<UpdateLanguageResponse> {
    return this.request<UpdateLanguageResponse>("/v1/buyers/preferences/language", {
      method: "PUT",
      body: JSON.stringify({ preferredLanguage } satisfies UpdateLanguageRequest),
    });
  }

  async listProducts(): Promise<CatalogProductsResponse["items"]> {
    const payload = await this.request<CatalogProductsResponse>("/v1/catalog/products");
    return payload.items;
  }

  async getProductDetail(productId: string): Promise<ProductDetail> {
    return this.request<ProductDetail>(`/v1/catalog/products/${encodeURIComponent(productId)}`);
  }

  async createOrder(input: CreateOrderRequest): Promise<Order> {
    return this.request<Order>("/v1/orders", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async listOrders(): Promise<Order[]> {
    const payload = await this.request<{ items: Order[] }>("/v1/orders");
    return payload.items;
  }

  async getOrderDetail(orderId: string): Promise<Order> {
    return this.request<Order>(`/v1/orders/${encodeURIComponent(orderId)}`);
  }

  async listRefunds(orderId: string): Promise<RefundDecision[]> {
    const payload = await this.request<{ items: RefundDecision[] }>(`/v1/orders/${encodeURIComponent(orderId)}/refunds`);
    return payload.items;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = this.getToken();
    if (!token) {
      throw new Error("missing_buyer_session");
    }

    const requestInit: RequestInit = {
      ...init,
      method: init?.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    };

    if (this.transport) {
      return (await this.transport(path, requestInit)) as T;
    }

    const response = await fetch(`${this.baseUrl}${path}`, requestInit);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `request_failed_${response.status}`);
    }

    return (await response.json()) as T;
  }
}
