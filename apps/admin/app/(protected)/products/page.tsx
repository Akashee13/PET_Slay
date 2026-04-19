"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { getAdminSessionToken } from "@/src/features/auth/admin-session";
import {
  createAdminProduct,
  type AdminProduct,
  updateAdminProduct,
} from "@/src/services/admin-api";

type CreateForm = {
  title: string;
  category: string;
  description: string;
  baseWholesalePrice: string;
  moq: string;
  availabilityStatus: string;
};

type UpdateForm = {
  productId: string;
  title: string;
  description: string;
  baseWholesalePrice: string;
  moq: string;
  availabilityStatus: string;
  isNewArrival: string;
};

const defaultCreateForm: CreateForm = {
  title: "",
  category: "western",
  description: "",
  baseWholesalePrice: "",
  moq: "",
  availabilityStatus: "in_stock",
};

const defaultUpdateForm: UpdateForm = {
  productId: "",
  title: "",
  description: "",
  baseWholesalePrice: "",
  moq: "",
  availabilityStatus: "",
  isNewArrival: "",
};

export default function ProductsPage() {
  const [createForm, setCreateForm] = useState<CreateForm>(defaultCreateForm);
  const [updateForm, setUpdateForm] = useState<UpdateForm>(defaultUpdateForm);
  const [result, setResult] = useState<AdminProduct | null>(null);
  const [error, setError] = useState("");

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      return;
    }

    setError("");
    try {
      const created = await createAdminProduct(token, {
        title: createForm.title,
        category: createForm.category,
        description: createForm.description,
        baseWholesalePrice: Number(createForm.baseWholesalePrice),
        moq: Number(createForm.moq),
        availabilityStatus: createForm.availabilityStatus,
      });
      setResult(created);
      setCreateForm(defaultCreateForm);
      setUpdateForm((current) => ({ ...current, productId: created.id }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to create product");
    }
  }

  async function onUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      return;
    }

    if (!updateForm.productId.trim()) {
      setError("productId is required for update");
      return;
    }

    const payload: {
      title?: string;
      description?: string;
      baseWholesalePrice?: number;
      moq?: number;
      availabilityStatus?: string;
      isNewArrival?: boolean;
    } = {};

    if (updateForm.title.trim()) payload.title = updateForm.title.trim();
    if (updateForm.description.trim()) payload.description = updateForm.description.trim();
    if (updateForm.baseWholesalePrice.trim()) payload.baseWholesalePrice = Number(updateForm.baseWholesalePrice);
    if (updateForm.moq.trim()) payload.moq = Number(updateForm.moq);
    if (updateForm.availabilityStatus.trim()) payload.availabilityStatus = updateForm.availabilityStatus.trim();
    if (updateForm.isNewArrival.trim()) payload.isNewArrival = updateForm.isNewArrival === "true";

    setError("");
    try {
      const updated = await updateAdminProduct(token, updateForm.productId.trim(), payload);
      setResult(updated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update product");
    }
  }

  return (
    <main style={{ display: "grid", gap: 24 }}>
      <h1>Products Operations</h1>
      <p>
        Current backend supports create and update by ID. Use this screen to operate `/v1/admin/products` and `/v1/admin/products/{'{productId}'}`.
      </p>

      {error && <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</p>}

      <section style={{ border: "1px solid #ddd", borderRadius: 6, padding: 14 }}>
        <h2>Create Product</h2>
        <form onSubmit={onCreate} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
          <input placeholder="Title" value={createForm.title} onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))} required />
          <input placeholder="Category (western/south_asian etc.)" value={createForm.category} onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value }))} required />
          <textarea placeholder="Description" value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} />
          <input placeholder="Base wholesale price" type="number" step="0.01" value={createForm.baseWholesalePrice} onChange={(event) => setCreateForm((current) => ({ ...current, baseWholesalePrice: event.target.value }))} required />
          <input placeholder="MOQ" type="number" value={createForm.moq} onChange={(event) => setCreateForm((current) => ({ ...current, moq: event.target.value }))} required />
          <input placeholder="Availability status" value={createForm.availabilityStatus} onChange={(event) => setCreateForm((current) => ({ ...current, availabilityStatus: event.target.value }))} />
          <button type="submit">Create Product</button>
        </form>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 6, padding: 14 }}>
        <h2>Update Product</h2>
        <form onSubmit={onUpdate} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
          <input placeholder="Product ID (required)" value={updateForm.productId} onChange={(event) => setUpdateForm((current) => ({ ...current, productId: event.target.value }))} required />
          <input placeholder="Title (optional)" value={updateForm.title} onChange={(event) => setUpdateForm((current) => ({ ...current, title: event.target.value }))} />
          <textarea placeholder="Description (optional)" value={updateForm.description} onChange={(event) => setUpdateForm((current) => ({ ...current, description: event.target.value }))} />
          <input placeholder="Base wholesale price (optional)" type="number" step="0.01" value={updateForm.baseWholesalePrice} onChange={(event) => setUpdateForm((current) => ({ ...current, baseWholesalePrice: event.target.value }))} />
          <input placeholder="MOQ (optional)" type="number" value={updateForm.moq} onChange={(event) => setUpdateForm((current) => ({ ...current, moq: event.target.value }))} />
          <input placeholder="Availability status (optional)" value={updateForm.availabilityStatus} onChange={(event) => setUpdateForm((current) => ({ ...current, availabilityStatus: event.target.value }))} />
          <input placeholder="isNewArrival true|false (optional)" value={updateForm.isNewArrival} onChange={(event) => setUpdateForm((current) => ({ ...current, isNewArrival: event.target.value }))} />
          <button type="submit">Update Product</button>
        </form>
        {updateForm.productId && (
          <p style={{ marginTop: 8 }}>
            Direct link: <Link href={`/products/${updateForm.productId}`}>Open product operation page</Link>
          </p>
        )}
      </section>

      {result && (
        <section>
          <h2>Latest Response</h2>
          <pre style={{ background: "#f6f6f6", padding: 12, overflow: "auto" }}>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}
