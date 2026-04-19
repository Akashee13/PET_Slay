const DEFAULT_STAGE_API_BASE_URL = "https://pet-slay-api-stage-j67sekma7a-el.a.run.app";

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_STAGE_API_BASE_URL).replace(/\/$/, "");
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  token: string;
  body?: unknown;
};

async function adminRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `request_failed_${response.status}`);
  }

  return (await response.json()) as T;
}

export type AdminProductInput = {
  title: string;
  category: string;
  description?: string;
  baseWholesalePrice: number;
  moq: number;
  availabilityStatus?: string;
  imageUrls?: string[];
};

export type AdminProductUpdateInput = {
  title?: string;
  description?: string;
  baseWholesalePrice?: number;
  moq?: number;
  availabilityStatus?: string;
  isNewArrival?: boolean;
  imageUrls?: string[];
  listingAction?: "list_now" | "unlist_now";
  listingStatus?: "listed" | "unlisted";
};

export type AdminProduct = {
  id: string;
  title: string;
  category: string;
  description?: string;
  baseWholesalePrice: number;
  moq: number;
  availabilityStatus: string;
  isNewArrival?: boolean;
  coverImageUrl?: string;
  imageUrls?: string[];
  listingStatus: "listed" | "unlisted";
  visibleUntil?: string;
};

export type AdminOrder = {
  id: string;
  status: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    productVariantId?: string;
  }>;
};

export async function createAdminProduct(token: string, input: AdminProductInput): Promise<AdminProduct> {
  return adminRequest<AdminProduct>("/v1/admin/products", {
    method: "POST",
    token,
    body: input,
  });
}

export async function updateAdminProduct(token: string, productId: string, input: AdminProductUpdateInput): Promise<AdminProduct> {
  return adminRequest<AdminProduct>(`/v1/admin/products/${productId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export async function updateProductListing(token: string, productId: string, listingAction: "list_now" | "unlist_now"): Promise<AdminProduct> {
  return updateAdminProduct(token, productId, { listingAction });
}

export async function listAdminProducts(token: string): Promise<AdminProduct[]> {
  const payload = await adminRequest<{ items: AdminProduct[] }>("/v1/admin/products", {
    method: "GET",
    token,
  });

  return payload.items;
}

export async function listAdminOrders(token: string): Promise<AdminOrder[]> {
  const payload = await adminRequest<{ items: AdminOrder[] }>("/v1/admin/orders", {
    method: "GET",
    token,
  });

  return payload.items;
}

export async function updateAdminOrderStatus(token: string, orderId: string, status: string): Promise<AdminOrder> {
  return adminRequest<AdminOrder>(`/v1/admin/orders/${orderId}`, {
    method: "PATCH",
    token,
    body: { status },
  });
}
