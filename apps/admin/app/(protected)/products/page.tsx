"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { getAdminSessionToken } from "@/src/features/auth/admin-session";
import { useAdminLanguage } from "@/src/features/i18n/admin-language";
import {
  createAdminProduct,
  type AdminProduct,
  listAdminProducts,
  updateAdminProduct,
} from "@/src/services/admin-api";
import { uploadProductImages } from "@/src/services/product-image-upload";
import { isAdminSupabaseConfigured } from "@/src/services/supabase";

type CreateForm = {
  title: string;
  category: string;
  description: string;
  baseWholesalePrice: string;
  moq: string;
  availabilityStatus: string;
  imageUrls: string[];
};

type UpdateForm = {
  productId: string;
  title: string;
  description: string;
  baseWholesalePrice: string;
  moq: string;
  availabilityStatus: string;
  isNewArrival: string;
  imageUrls: string[];
};

const defaultCreateForm: CreateForm = {
  title: "",
  category: "western",
  description: "",
  baseWholesalePrice: "",
  moq: "",
  availabilityStatus: "in_stock",
  imageUrls: [""],
};

const defaultUpdateForm: UpdateForm = {
  productId: "",
  title: "",
  description: "",
  baseWholesalePrice: "",
  moq: "",
  availabilityStatus: "",
  isNewArrival: "",
  imageUrls: [""],
};

function normalizeImageUrls(imageUrls: string[]): string[] {
  return imageUrls.map((imageUrl) => imageUrl.trim()).filter(Boolean).slice(0, 5);
}

function setImageAt(imageUrls: string[], index: number, value: string): string[] {
  const next = [...imageUrls];
  next[index] = value;
  return next;
}

function addImageField(imageUrls: string[]): string[] {
  if (imageUrls.length >= 5) {
    return imageUrls;
  }
  return [...imageUrls, ""];
}

function removeImageField(imageUrls: string[], index: number): string[] {
  const next = imageUrls.filter((_, currentIndex) => currentIndex != index);
  return next.length > 0 ? next : [""];
}

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
  const { t } = useAdminLanguage();
  const [createForm, setCreateForm] = useState<CreateForm>(defaultCreateForm);
  const [updateForm, setUpdateForm] = useState<UpdateForm>(defaultUpdateForm);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [createUploadFiles, setCreateUploadFiles] = useState<File[]>([]);
  const [updateUploadFiles, setUpdateUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<AdminProduct | null>(null);
  const [error, setError] = useState("");

  const activeProducts = useMemo(
    () => [...products].sort((left, right) => right.id.localeCompare(left.id)),
    [products]
  );

  async function loadProducts() {
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      setProductsLoading(false);
      return;
    }

    setProductsLoading(true);
    setError("");
    try {
      const items = await listAdminProducts(token);
      setProducts(items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to fetch product catalog");
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      return;
    }

    setError("");
    try {
      const manualImageUrls = normalizeImageUrls(createForm.imageUrls);
      const filesToUpload = createUploadFiles.slice(0, 5);

      if (manualImageUrls.length+ filesToUpload.length > 5) {
        setError("You can attach maximum 5 images per product.");
        return;
      }

      setUploading(true);
      const uploadedImageUrls = await uploadProductImages(filesToUpload, {
        productTitleHint: createForm.title,
      });

      const created = await createAdminProduct(token, {
        title: createForm.title,
        category: createForm.category,
        description: createForm.description,
        baseWholesalePrice: Number(createForm.baseWholesalePrice),
        moq: Number(createForm.moq),
        availabilityStatus: createForm.availabilityStatus,
        imageUrls: [...manualImageUrls, ...uploadedImageUrls],
      });
      setResult(created);
      setCreateForm(defaultCreateForm);
      setCreateUploadFiles([]);
      setUpdateForm((current) => ({ ...current, productId: created.id }));
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to create product");
    } finally {
      setUploading(false);
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
      imageUrls?: string[];
    } = {};

    if (updateForm.title.trim()) payload.title = updateForm.title.trim();
    if (updateForm.description.trim()) payload.description = updateForm.description.trim();
    if (updateForm.baseWholesalePrice.trim()) payload.baseWholesalePrice = Number(updateForm.baseWholesalePrice);
    if (updateForm.moq.trim()) payload.moq = Number(updateForm.moq);
    if (updateForm.availabilityStatus.trim()) payload.availabilityStatus = updateForm.availabilityStatus.trim();
    if (updateForm.isNewArrival.trim()) payload.isNewArrival = updateForm.isNewArrival === "true";

    const normalizedImageUrls = normalizeImageUrls(updateForm.imageUrls);
    const filesToUpload = updateUploadFiles.slice(0, 5);
    if (normalizedImageUrls.length+ filesToUpload.length > 5) {
      setError("You can attach maximum 5 images per product.");
      return;
    }

    setError("");
    try {
      setUploading(true);
      const uploadedImageUrls = await uploadProductImages(filesToUpload, {
        productTitleHint: updateForm.title || updateForm.productId,
      });

      if (normalizedImageUrls.length > 0 || uploadedImageUrls.length > 0) {
        payload.imageUrls = [...normalizedImageUrls, ...uploadedImageUrls];
      }

      const updated = await updateAdminProduct(token, updateForm.productId.trim(), payload);
      setResult(updated);
      setUpdateUploadFiles([]);
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update product");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="stack-lg">
      <section className="toolbar">
        <div>
          <p className="eyebrow">{t("addProductEyebrow")}</p>
          <h1 className="headline">{t("addProductTitle")}</h1>
          <p className="subtle">{t("addProductSubtitle")}</p>
        </div>
        <Link href="/listed-products" className="button-link">{t("listedProductsNav")}</Link>
      </section>

      <section className="hero-panel stack">
        <h2 style={{ margin: 0 }}>Catalog Manager Snapshot</h2>
        <p className="subtle">Keep merchandising, stock intent, and image quality aligned before buyers place orders.</p>
        <div className="kpi-grid">
          <div className="kpi"><strong>{activeProducts.length}</strong><span className="subtle">Products in admin table</span></div>
          <div className="kpi"><strong>5 max</strong><span className="subtle">Images per product</span></div>
          <div className="kpi"><strong>Live</strong><span className="subtle">Stage API sync</span></div>
          <div className="kpi"><strong>Admin Ready</strong><span className="subtle">Business-first layout</span></div>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="data-grid">
        <article className="panel">
          <h2>Add New Product</h2>
          <p>Capture essential commercial details and upload up to 5 product images.</p>
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

            <label>Product image URLs (1 to 5)</label>
            {createForm.imageUrls.map((imageUrl, index) => (
              <div className="row" key={`create-image-${index}`}>
                <input
                  placeholder={`Image URL ${index + 1}`}
                  value={imageUrl}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      imageUrls: setImageAt(current.imageUrls, index, event.target.value),
                    }))
                  }
                />
                {createForm.imageUrls.length > 1 && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setCreateForm((current) => ({
                        ...current,
                        imageUrls: removeImageField(current.imageUrls, index),
                      }))
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {createForm.imageUrls.length < 5 && (
              <button type="button" className="secondary" onClick={() => setCreateForm((current) => ({ ...current, imageUrls: addImageField(current.imageUrls) }))}>
                Add another image
              </button>
            )}
            <label htmlFor="create-image-files">Upload images from device</label>
            <input
              id="create-image-files"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(event) => setCreateUploadFiles(Array.from(event.target.files ?? []).slice(0, 5))}
            />
            {createUploadFiles.length > 0 && <p className="subtle">Files selected: {createUploadFiles.map((file) => file.name).join(", ")}</p>}
            {!isAdminSupabaseConfigured() && <p className="error">Image upload needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</p>}
            <button type="submit">Create Product</button>
          </form>
        </article>

        <article className="panel">
          <h2>Update Existing Product</h2>
          <p>Adjust merchandising details and replace image set when needed.</p>
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

            <label>Replace image URLs (up to 5)</label>
            {updateForm.imageUrls.map((imageUrl, index) => (
              <div className="row" key={`update-image-${index}`}>
                <input
                  placeholder={`Image URL ${index + 1}`}
                  value={imageUrl}
                  onChange={(event) =>
                    setUpdateForm((current) => ({
                      ...current,
                      imageUrls: setImageAt(current.imageUrls, index, event.target.value),
                    }))
                  }
                />
                {updateForm.imageUrls.length > 1 && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setUpdateForm((current) => ({
                        ...current,
                        imageUrls: removeImageField(current.imageUrls, index),
                      }))
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {updateForm.imageUrls.length < 5 && (
              <button type="button" className="secondary" onClick={() => setUpdateForm((current) => ({ ...current, imageUrls: addImageField(current.imageUrls) }))}>
                Add another image
              </button>
            )}
            <label htmlFor="update-image-files">Upload images from device</label>
            <input
              id="update-image-files"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(event) => setUpdateUploadFiles(Array.from(event.target.files ?? []).slice(0, 5))}
            />
            {updateUploadFiles.length > 0 && <p className="subtle">Files selected: {updateUploadFiles.map((file) => file.name).join(", ")}</p>}
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
          <h2>Latest Product Response</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}

      {uploading && (
        <section className="panel">
          <p className="subtle">Uploading images… please wait.</p>
        </section>
      )}

      <section className="panel stack">
        <h2>All Uploaded Products</h2>
        <p>For list, unlist, and patch actions, use the dedicated listed-products table.</p>
        {productsLoading && <p className="subtle">Loading catalog…</p>}
        {!productsLoading && activeProducts.length === 0 && <p className="subtle">No products available yet.</p>}
        <div className="product-admin-grid">
          {activeProducts.map((product) => (
            <article key={product.id} className="ai-card">
              <img src={product.coverImageUrl || product.imageUrls?.[0] || "https://image.pollinations.ai/prompt/minimal%20fashion%20placeholder%20image?width=1280&height=720&nologo=true"} alt={product.title} loading="lazy" referrerPolicy="no-referrer" />
              <div className="product-admin-body stack">
                <strong>{product.title}</strong>
                <span className="subtle">{product.id} • {product.category}</span>
                <span className="subtle">MOQ {product.moq} • ₹{product.baseWholesalePrice}</span>
                <span className="status-chip">{product.availabilityStatus}</span>
                {product.imageUrls && product.imageUrls.length > 0 && (
                  <div className="thumb-strip">
                    {product.imageUrls.map((imageUrl) => (
                      <img key={`${product.id}-${imageUrl}`} src={imageUrl} alt={`${product.title} asset`} loading="lazy" referrerPolicy="no-referrer" />
                    ))}
                  </div>
                )}
                <Link href="/listed-products" className="inline-link">Open listed-products table</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <h2>AI Visual Direction</h2>
        <p>Prompt-driven concept frames to guide merchandising banners and launch collections.</p>
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
