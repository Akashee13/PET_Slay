"use client";

import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { getAdminSessionToken } from "@/src/features/auth/admin-session";
import { type AdminProduct, updateAdminProduct, updateProductListing } from "@/src/services/admin-api";
import { uploadProductImages } from "@/src/services/product-image-upload";
import { isAdminSupabaseConfigured } from "@/src/services/supabase";

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [baseWholesalePrice, setBaseWholesalePrice] = useState("");
  const [moq, setMoq] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("");
  const [isNewArrival, setIsNewArrival] = useState("");
  const [imageUrlsText, setImageUrlsText] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [listingBusy, setListingBusy] = useState(false);
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
      imageUrls?: string[];
    } = {};

    if (title.trim()) payload.title = title.trim();
    if (description.trim()) payload.description = description.trim();
    if (baseWholesalePrice.trim()) payload.baseWholesalePrice = Number(baseWholesalePrice);
    if (moq.trim()) payload.moq = Number(moq);
    if (availabilityStatus.trim()) payload.availabilityStatus = availabilityStatus.trim();
    if (isNewArrival.trim()) payload.isNewArrival = isNewArrival === "true";

    const manualImageUrls = imageUrlsText
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (manualImageUrls.length + uploadFiles.length > 5) {
      setError("You can attach maximum 5 images per product.");
      return;
    }

    if (imageUrlsText.trim()) {
      payload.imageUrls = manualImageUrls;
    }

    setError("");
    try {
      setUploading(true);
      const uploadedImageUrls = await uploadProductImages(uploadFiles, {
        productTitleHint: title || params.productId,
      });
      if (manualImageUrls.length > 0 || uploadedImageUrls.length > 0) {
        payload.imageUrls = [...manualImageUrls, ...uploadedImageUrls].slice(0, 5);
      }

      const updated = await updateAdminProduct(token, params.productId, payload);
      setResult(updated);
      setUploadFiles([]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update product");
    } finally {
      setUploading(false);
    }
  }

  async function onListingAction(action: "list_now" | "unlist_now") {
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      return;
    }

    setListingBusy(true);
    setError("");
    try {
      setResult(await updateProductListing(token, params.productId, action));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update listing");
    } finally {
      setListingBusy(false);
    }
  }

  return (
    <main className="stack-lg">
      <section className="toolbar">
        <div>
          <p className="eyebrow">Inventory Detail</p>
          <h1 className="headline">Product {params.productId}</h1>
          <p className="subtle">Update business details and replace image set for this product.</p>
        </div>
      </section>

      <section className="panel row">
        <button type="button" className="secondary" disabled={listingBusy} onClick={() => onListingAction("list_now")}>
          List now for 60 days
        </button>
        <button type="button" className="secondary danger-action" disabled={listingBusy} onClick={() => onListingAction("unlist_now")}>
          Unlist now
        </button>
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
          <label htmlFor="detail-images">Image URLs (one per line, max 5)</label>
          <textarea id="detail-images" placeholder="https://cdn.example.com/look-1.jpg" value={imageUrlsText} onChange={(event) => setImageUrlsText(event.target.value)} rows={5} />
          <label htmlFor="detail-image-files">Upload images from device</label>
          <input
            id="detail-image-files"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []).slice(0, 5))}
          />
          {uploadFiles.length > 0 && <p className="subtle">Files selected: {uploadFiles.map((file) => file.name).join(", ")}</p>}
          {!isAdminSupabaseConfigured() && <p className="error">Image upload needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</p>}
          <button type="submit">Patch Product</button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      {uploading && <p className="subtle">Uploading images… please wait.</p>}
      {result && (
        <section className="panel stack">
          {result.imageUrls && result.imageUrls.length > 0 && (
            <div className="thumb-strip">
              {result.imageUrls.map((imageUrl) => (
                <img key={imageUrl} src={imageUrl} alt={`${result.title} asset`} loading="lazy" referrerPolicy="no-referrer" />
              ))}
            </div>
          )}
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}
