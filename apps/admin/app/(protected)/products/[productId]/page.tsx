"use client";

import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { getAdminSessionToken } from "@/src/features/auth/admin-session";
import { mergeSelectedProductImages, removeSelectedProductImage } from "@/src/features/products/file-selection";
import { type AdminProduct, updateAdminProduct } from "@/src/services/admin-api";
import { uploadProductImages } from "@/src/services/product-image-upload";
import { isAdminSupabaseConfigured } from "@/src/services/supabase";

function BusyOverlay({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="busy-overlay" role="status" aria-live="assertive" aria-label={title}>
      <div className="busy-card">
        <span className="spinner large" aria-hidden="true" />
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
    </div>
  );
}

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
  const [result, setResult] = useState<AdminProduct | null>(null);
  const [error, setError] = useState("");
  const isBusy = uploading;
  const busyTitle = "Editing product";
  const busyDetail = "Uploading replacement images and saving product details. Please keep this tab open.";

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

  return (
    <main className="stack-lg" aria-busy={isBusy}>
      {isBusy && <BusyOverlay title={busyTitle} detail={busyDetail} />}
      <section className="toolbar">
        <div>
          <p className="eyebrow">Inventory Detail</p>
          <h1 className="headline">Product {params.productId}</h1>
          <p className="subtle">Update business details and replace image set for this product.</p>
        </div>
      </section>

      <section className="panel">
        <form onSubmit={onSubmit} className="field-grid">
          <label htmlFor="detail-title">Title (optional)</label>
          <input id="detail-title" placeholder="Title (optional)" value={title} onChange={(event) => setTitle(event.target.value)} disabled={isBusy} />
          <label htmlFor="detail-description">Description (optional)</label>
          <textarea id="detail-description" placeholder="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} disabled={isBusy} />
          <label htmlFor="detail-price">Base wholesale price (optional)</label>
          <input id="detail-price" placeholder="Base wholesale price (optional)" type="number" step="0.01" value={baseWholesalePrice} onChange={(event) => setBaseWholesalePrice(event.target.value)} disabled={isBusy} />
          <label htmlFor="detail-moq">MOQ (optional)</label>
          <input id="detail-moq" placeholder="MOQ (optional)" type="number" value={moq} onChange={(event) => setMoq(event.target.value)} disabled={isBusy} />
          <label htmlFor="detail-status">Availability status (optional)</label>
          <input id="detail-status" placeholder="Availability status (optional)" value={availabilityStatus} onChange={(event) => setAvailabilityStatus(event.target.value)} disabled={isBusy} />
          <label htmlFor="detail-arrival">isNewArrival true|false (optional)</label>
          <input id="detail-arrival" placeholder="isNewArrival true|false (optional)" value={isNewArrival} onChange={(event) => setIsNewArrival(event.target.value)} disabled={isBusy} />
          <div className="file-picker-card">
            <div>
              <label htmlFor="detail-image-files">Replace images from device</label>
              <p className="file-help">Optional for editing. Select up to 5 images at once, or choose again to add more.</p>
            </div>
            <input
              id="detail-image-files"
              className="native-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={isBusy}
              onChange={(event) => {
                setUploadFiles((current) => mergeSelectedProductImages(current, Array.from(event.target.files ?? [])));
              }}
            />
            <label className={`file-picker-button ${isBusy ? "disabled" : ""}`} htmlFor="detail-image-files">
              Choose replacement images
            </label>
            <strong className="file-selection-summary">
              {uploadFiles.length > 0 ? `${uploadFiles.length} image${uploadFiles.length === 1 ? "" : "s"} selected` : "No replacement images selected"}
            </strong>
            {uploadFiles.length > 0 && (
              <div className="file-chip-row" aria-live="polite">
                {uploadFiles.map((file, index) => (
                  <span className="file-chip" key={`${file.name}-${file.size}-${file.lastModified}`}>
                    {file.name}
                    <button type="button" disabled={isBusy} onClick={() => setUploadFiles((current) => removeSelectedProductImage(current, index))}>
                      Remove
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          {!isAdminSupabaseConfigured() && <p className="error">Image upload needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</p>}
          <button type="submit" disabled={isBusy}>
            {uploading && <span className="spinner" aria-hidden="true" />}
            {uploading ? "Editing product..." : "Edit Product"}
          </button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}
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
