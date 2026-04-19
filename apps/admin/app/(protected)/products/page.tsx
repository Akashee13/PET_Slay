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

const INVENTORY_AI_SHOTS = [
  {
    label: "Aisle intelligence dashboard",
    prompt: "warehouse inventory dashboard ui, clean glassmorphism cards, fashion boxes, blue teal palette, cinematic lighting"
  },
  {
    label: "SKU scanning operations",
    prompt: "mobile warehouse sku scanner interface, premium ux, modern warehouse environment, neon accents"
  },
  {
    label: "Realtime stock command center",
    prompt: "realtime stock monitoring admin panel, logistics map, elegant data visualization, high-end product ui"
  }
] as const;

function buildAiImageUrl(prompt: string): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&enhance=true`;
}

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
    <main className="stack-lg">
      <section className="toolbar">
        <div>
          <p className="eyebrow">Inventory Control</p>
          <h1 className="headline">Products Operations</h1>
          <p className="subtle">Use this screen to operate `/v1/admin/products` and `/v1/admin/products/{'{productId}'}`.</p>
        </div>
      </section>

      <section className="hero-panel stack">
        <h2 style={{ margin: 0 }}>Warehouse Intelligence Theme</h2>
        <p className="subtle">Bold, operational visuals with calm contrast and data-first hierarchy for faster inventory decisions.</p>
        <div className="kpi-grid">
          <div className="kpi"><strong>24h</strong><span className="subtle">Refresh cadence</span></div>
          <div className="kpi"><strong>SKU Ops</strong><span className="subtle">Create + patch flow</span></div>
          <div className="kpi"><strong>Mobile Ready</strong><span className="subtle">Cards and forms adapt</span></div>
          <div className="kpi"><strong>AI Moodboard</strong><span className="subtle">Visual direction embedded</span></div>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="data-grid">
        <article className="panel">
          <h2>Create Product</h2>
          <p>Add new inventory entries with category, wholesale price, and MOQ.</p>
          <form onSubmit={onCreate} className="field-grid">
            <label htmlFor="create-title">Title</label>
            <input id="create-title" placeholder="Title" value={createForm.title} onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))} required />
            <label htmlFor="create-category">Category</label>
            <input id="create-category" placeholder="Category (western/south_asian etc.)" value={createForm.category} onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value }))} required />
            <label htmlFor="create-description">Description</label>
            <textarea id="create-description" placeholder="Description" value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} />
            <label htmlFor="create-base-price">Base wholesale price</label>
            <input id="create-base-price" placeholder="Base wholesale price" type="number" step="0.01" value={createForm.baseWholesalePrice} onChange={(event) => setCreateForm((current) => ({ ...current, baseWholesalePrice: event.target.value }))} required />
            <label htmlFor="create-moq">MOQ</label>
            <input id="create-moq" placeholder="MOQ" type="number" value={createForm.moq} onChange={(event) => setCreateForm((current) => ({ ...current, moq: event.target.value }))} required />
            <label htmlFor="create-status">Availability status</label>
            <input id="create-status" placeholder="Availability status" value={createForm.availabilityStatus} onChange={(event) => setCreateForm((current) => ({ ...current, availabilityStatus: event.target.value }))} />
            <button type="submit">Create Product</button>
          </form>
        </article>

        <article className="panel">
          <h2>Update Product</h2>
          <p>Patch one or more fields on an existing product by ID.</p>
          <form onSubmit={onUpdate} className="field-grid">
            <label htmlFor="update-product-id">Product ID (required)</label>
            <input id="update-product-id" placeholder="Product ID (required)" value={updateForm.productId} onChange={(event) => setUpdateForm((current) => ({ ...current, productId: event.target.value }))} required />
            <label htmlFor="update-title">Title (optional)</label>
            <input id="update-title" placeholder="Title (optional)" value={updateForm.title} onChange={(event) => setUpdateForm((current) => ({ ...current, title: event.target.value }))} />
            <label htmlFor="update-description">Description (optional)</label>
            <textarea id="update-description" placeholder="Description (optional)" value={updateForm.description} onChange={(event) => setUpdateForm((current) => ({ ...current, description: event.target.value }))} />
            <label htmlFor="update-base-price">Base wholesale price (optional)</label>
            <input id="update-base-price" placeholder="Base wholesale price (optional)" type="number" step="0.01" value={updateForm.baseWholesalePrice} onChange={(event) => setUpdateForm((current) => ({ ...current, baseWholesalePrice: event.target.value }))} />
            <label htmlFor="update-moq">MOQ (optional)</label>
            <input id="update-moq" placeholder="MOQ (optional)" type="number" value={updateForm.moq} onChange={(event) => setUpdateForm((current) => ({ ...current, moq: event.target.value }))} />
            <label htmlFor="update-status">Availability status (optional)</label>
            <input id="update-status" placeholder="Availability status (optional)" value={updateForm.availabilityStatus} onChange={(event) => setUpdateForm((current) => ({ ...current, availabilityStatus: event.target.value }))} />
            <label htmlFor="update-arrival">isNewArrival true|false (optional)</label>
            <input id="update-arrival" placeholder="isNewArrival true|false (optional)" value={updateForm.isNewArrival} onChange={(event) => setUpdateForm((current) => ({ ...current, isNewArrival: event.target.value }))} />
            <button type="submit">Update Product</button>
          </form>
          {updateForm.productId && (
            <p style={{ marginBottom: 0 }}>
              Direct link: <Link href={`/products/${updateForm.productId}`} className="inline-link">Open product operation page</Link>
            </p>
          )}
        </article>
      </section>

      {result && (
        <section className="panel">
          <h2>Latest Response</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}

      <section className="panel stack">
        <h2>AI Visual Direction</h2>
        <p>Prompt-driven concept frames that match the requested warehouse design language.</p>
        <div className="ai-gallery">
          {INVENTORY_AI_SHOTS.map((shot) => (
            <article key={shot.label} className="ai-card">
              <img src={buildAiImageUrl(shot.prompt)} alt={shot.label} loading="lazy" referrerPolicy="no-referrer" />
              <p className="ai-caption">{shot.label}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
