"use client";

import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { getAdminSessionToken } from "@/src/features/auth/admin-session";
import { type AdminProduct, updateAdminProduct } from "@/src/services/admin-api";

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [baseWholesalePrice, setBaseWholesalePrice] = useState("");
  const [moq, setMoq] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("");
  const [isNewArrival, setIsNewArrival] = useState("");
  const [result, setResult] = useState<AdminProduct | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
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

    if (title.trim()) payload.title = title.trim();
    if (description.trim()) payload.description = description.trim();
    if (baseWholesalePrice.trim()) payload.baseWholesalePrice = Number(baseWholesalePrice);
    if (moq.trim()) payload.moq = Number(moq);
    if (availabilityStatus.trim()) payload.availabilityStatus = availabilityStatus.trim();
    if (isNewArrival.trim()) payload.isNewArrival = isNewArrival === "true";

    setError("");
    try {
      const updated = await updateAdminProduct(token, params.productId, payload);
      setResult(updated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update product");
    }
  }

  return (
    <main className="stack-lg">
      <section className="toolbar">
        <div>
          <p className="eyebrow">Inventory Detail</p>
          <h1 className="headline">Product {params.productId}</h1>
          <p className="subtle">Patch fields through `/v1/admin/products/{'{productId}'}`.</p>
        </div>
      </section>

      <section className="panel">
        <form onSubmit={onSubmit} className="field-grid">
          <label htmlFor="detail-title">Title (optional)</label>
          <input id="detail-title" placeholder="Title (optional)" value={title} onChange={(event) => setTitle(event.target.value)} />
          <label htmlFor="detail-description">Description (optional)</label>
          <textarea id="detail-description" placeholder="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} />
          <label htmlFor="detail-price">Base wholesale price (optional)</label>
          <input id="detail-price" placeholder="Base wholesale price (optional)" type="number" step="0.01" value={baseWholesalePrice} onChange={(event) => setBaseWholesalePrice(event.target.value)} />
          <label htmlFor="detail-moq">MOQ (optional)</label>
          <input id="detail-moq" placeholder="MOQ (optional)" type="number" value={moq} onChange={(event) => setMoq(event.target.value)} />
          <label htmlFor="detail-status">Availability status (optional)</label>
          <input id="detail-status" placeholder="Availability status (optional)" value={availabilityStatus} onChange={(event) => setAvailabilityStatus(event.target.value)} />
          <label htmlFor="detail-arrival">isNewArrival true|false (optional)</label>
          <input id="detail-arrival" placeholder="isNewArrival true|false (optional)" value={isNewArrival} onChange={(event) => setIsNewArrival(event.target.value)} />
          <button type="submit">Patch Product</button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}
