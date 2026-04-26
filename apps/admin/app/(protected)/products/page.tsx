"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { getAdminSessionToken } from "@/src/features/auth/admin-session";
import { useAdminLanguage } from "@/src/features/i18n/admin-language";
import { mergeSelectedProductImages, removeSelectedProductImage } from "@/src/features/products/file-selection";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProduct,
  type AdminProduct,
  listAdminProducts,
  updateAdminProduct,
} from "@/src/services/admin-api";
import { uploadProductImages } from "@/src/services/product-image-upload";
import { isAdminSupabaseConfigured } from "@/src/services/supabase";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

type CreateForm = {
  title: string;
  category: string;
  description: string;
  baseWholesalePrice: string;
  availabilityStatus: string;
  availableSizes: string[];
  listImmediately: boolean;
};

type UpdateForm = {
  productId: string;
  title: string;
  category: string;
  description: string;
  baseWholesalePrice: string;
  availabilityStatus: string;
  isNewArrival: boolean;
  availableSizes: string[];
  currentImageUrls: string[];
};

type BusyOperation = "create" | "update" | "prefill" | "";
type ModalMode = "create" | "edit" | null;

const defaultCreateForm: CreateForm = {
  title: "",
  category: "western",
  description: "",
  baseWholesalePrice: "",
  availabilityStatus: "in_stock",
  availableSizes: ["M"],
  listImmediately: true,
};

const defaultUpdateForm: UpdateForm = {
  productId: "",
  title: "",
  category: "western",
  description: "",
  baseWholesalePrice: "",
  availabilityStatus: "in_stock",
  isNewArrival: false,
  availableSizes: ["M"],
  currentImageUrls: [],
};

const INVENTORY_AI_SHOTS = [
  {
    label: "Aisle intelligence dashboard",
    prompt: "warehouse inventory dashboard ui, clean glassmorphism cards, fashion boxes, blue teal palette, cinematic lighting",
  },
  {
    label: "SKU scanning operations",
    prompt: "mobile warehouse sku scanner interface, premium ux, modern warehouse environment, neon accents",
  },
  {
    label: "Realtime stock command center",
    prompt: "realtime stock monitoring admin panel, logistics map, elegant data visualization, high-end product ui",
  },
] as const;

function buildAiImageUrl(prompt: string): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&enhance=true`;
}

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

function toggleSize(current: string[], sizeLabel: string): string[] {
  if (current.includes(sizeLabel)) {
    return current.filter((size) => size !== sizeLabel);
  }

  return [...current, sizeLabel];
}

function toUpdateForm(product: AdminProduct): UpdateForm {
  return {
    productId: product.id,
    title: product.title,
    category: product.category,
    description: product.description ?? "",
    baseWholesalePrice: String(product.baseWholesalePrice ?? ""),
    availabilityStatus: product.availabilityStatus || "in_stock",
    isNewArrival: Boolean(product.isNewArrival),
    availableSizes:
      product.variants?.map((variant) => variant.sizeLabel).filter(Boolean) && product.variants.length > 0
        ? product.variants.map((variant) => variant.sizeLabel)
        : ["M"],
    currentImageUrls: product.imageUrls ?? [],
  };
}

export default function ProductsPage() {
  const { t } = useAdminLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(defaultCreateForm);
  const [updateForm, setUpdateForm] = useState<UpdateForm>(defaultUpdateForm);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedEditProductId, setSelectedEditProductId] = useState("");
  const [createUploadFiles, setCreateUploadFiles] = useState<File[]>([]);
  const [updateUploadFiles, setUpdateUploadFiles] = useState<File[]>([]);
  const [busyOperation, setBusyOperation] = useState<BusyOperation | "delete">("");
  const [result, setResult] = useState<AdminProduct | null>(null);
  const [error, setError] = useState("");
  const [deleteConfirmArmed, setDeleteConfirmArmed] = useState(false);
  const dismissedEditParamRef = useRef<string | null>(null);
  const isBusy = busyOperation !== "";

  const activeProducts = useMemo(() => [...products].sort((left, right) => right.id.localeCompare(left.id)), [products]);
  const busyTitle =
    busyOperation === "create"
      ? "Creating product"
      : busyOperation === "update"
        ? "Updating product"
        : busyOperation === "delete"
          ? "Deleting product"
        : "Loading product details";
  const busyDetail =
    busyOperation === "create"
      ? "Uploading product images and creating the catalog item. Please keep this tab open."
      : busyOperation === "update"
        ? "Saving the edited product and replacing images if selected. Please keep this tab open."
        : busyOperation === "delete"
          ? "Removing the product and refreshing the admin catalog. Please keep this tab open."
        : "Fetching the latest product details to prefill the edit form.";

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

  useEffect(() => {
    const editProductId = searchParams.get("edit");
    if (!editProductId) {
      dismissedEditParamRef.current = null;
      return;
    }
    if (dismissedEditParamRef.current === editProductId || productsLoading || isBusy) {
      return;
    }
    if (!activeProducts.some((product) => product.id === editProductId)) {
      return;
    }
    if (modalMode === "edit" && selectedEditProductId === editProductId) {
      return;
    }

    void prefillEditForm(editProductId);
  }, [activeProducts, isBusy, modalMode, productsLoading, searchParams, selectedEditProductId]);

  function closeModal() {
    if (isBusy) {
      return;
    }
    dismissedEditParamRef.current = searchParams.get("edit");
    setModalMode(null);
    setError("");
    setSelectedEditProductId("");
    setCreateForm(defaultCreateForm);
    setUpdateForm(defaultUpdateForm);
    setCreateUploadFiles([]);
    setUpdateUploadFiles([]);
    setDeleteConfirmArmed(false);
    if (searchParams.get("edit")) {
      router.replace("/products");
    }
  }

  function openCreateModal() {
    dismissedEditParamRef.current = null;
    setCreateForm(defaultCreateForm);
    setCreateUploadFiles([]);
    setError("");
    setDeleteConfirmArmed(false);
    setModalMode("create");
    router.replace("/products");
  }

  async function prefillEditForm(productId: string) {
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      return;
    }

    setBusyOperation("prefill");
    dismissedEditParamRef.current = null;
    setError("");
    try {
      const product = await getAdminProduct(token, productId);
      setSelectedEditProductId(productId);
      setUpdateForm(toUpdateForm(product));
      setUpdateUploadFiles([]);
      setDeleteConfirmArmed(false);
      setModalMode("edit");
      router.replace(`/products?edit=${encodeURIComponent(productId)}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load product details");
    } finally {
      setBusyOperation("");
    }
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      return;
    }

    if (createForm.availableSizes.length === 0) {
      setError("Select at least one available size.");
      return;
    }

    if (createUploadFiles.length === 0) {
      setError("Upload at least 1 product image from device before creating a product.");
      return;
    }

    setError("");
    try {
      setBusyOperation("create");
      const uploadedImageUrls = await uploadProductImages(createUploadFiles.slice(0, 5), {
        productTitleHint: createForm.title,
      });

      const created = await createAdminProduct(token, {
        title: createForm.title.trim(),
        category: createForm.category.trim(),
        description: createForm.description.trim(),
        baseWholesalePrice: Number(createForm.baseWholesalePrice),
        availabilityStatus: createForm.availabilityStatus.trim(),
        availableSizes: createForm.availableSizes,
        imageUrls: uploadedImageUrls,
        listingStatus: createForm.listImmediately ? "listed" : "unlisted",
      });
      setResult(created);
      setCreateForm(defaultCreateForm);
      setCreateUploadFiles([]);
      setModalMode(null);
      setSelectedEditProductId("");
      setUpdateForm(defaultUpdateForm);
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to create product");
    } finally {
      setBusyOperation("");
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
      setError("Select a product to edit first.");
      return;
    }

    if (updateForm.availableSizes.length === 0) {
      setError("Select at least one available size.");
      return;
    }

    setError("");
    try {
      setBusyOperation("update");
      let imageUrls = updateForm.currentImageUrls;
      if (updateUploadFiles.length > 0) {
        imageUrls = await uploadProductImages(updateUploadFiles.slice(0, 5), {
          productTitleHint: updateForm.title || updateForm.productId,
        });
      }

      const updated = await updateAdminProduct(token, updateForm.productId.trim(), {
        title: updateForm.title.trim(),
        description: updateForm.description.trim(),
        baseWholesalePrice: Number(updateForm.baseWholesalePrice),
        availabilityStatus: updateForm.availabilityStatus.trim(),
        availableSizes: updateForm.availableSizes,
        isNewArrival: updateForm.isNewArrival,
        imageUrls,
      });
      setResult(updated);
      setUpdateUploadFiles([]);
      setUpdateForm(toUpdateForm(updated));
      setDeleteConfirmArmed(false);
      setModalMode(null);
      dismissedEditParamRef.current = null;
      router.replace("/products");
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update product");
    } finally {
      setBusyOperation("");
    }
  }

  async function onDeleteProduct() {
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      return;
    }
    if (!updateForm.productId.trim()) {
      setError("Select a product to delete first.");
      return;
    }
    if (!deleteConfirmArmed) {
      setDeleteConfirmArmed(true);
      setError("Tap delete once more to confirm permanent removal.");
      return;
    }

    setError("");
    try {
      setBusyOperation("delete");
      await deleteAdminProduct(token, updateForm.productId.trim());
      setResult(null);
      setDeleteConfirmArmed(false);
      setModalMode(null);
      setSelectedEditProductId("");
      setUpdateForm(defaultUpdateForm);
      setUpdateUploadFiles([]);
      dismissedEditParamRef.current = null;
      router.replace("/products");
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete product");
    } finally {
      setBusyOperation("");
    }
  }

  return (
    <main className="stack-lg" aria-busy={isBusy}>
      {isBusy && <BusyOverlay title={busyTitle} detail={busyDetail} />}
      <section className="toolbar">
        <div>
          <p className="eyebrow">{t("addProductEyebrow")}</p>
          <h1 className="headline">{t("addProductTitle")}</h1>
          <p className="subtle">{t("addProductSubtitle")}</p>
        </div>
        <Link href="/listed-products" className="button-link">
          {t("listedProductsNav")}
        </Link>
      </section>

      <section className="hero-panel stack">
        <h2 style={{ margin: 0 }}>Product Operations Hub</h2>
        <p className="subtle">Open a focused modal for adding or editing products. Edit forms are prefilled so the admin can erase, refine, and resubmit quickly.</p>
        <div className="product-action-grid">
          <button className="product-action-card" type="button" onClick={openCreateModal}>
            <span className="product-action-card-title">Add Product</span>
            <span className="product-action-card-copy">Open a fresh intake form with image upload and size selection.</span>
          </button>
          <button
            className="product-action-card accent"
            type="button"
            onClick={() => {
              if (selectedEditProductId) {
                void prefillEditForm(selectedEditProductId);
              } else if (activeProducts[0]) {
                void prefillEditForm(activeProducts[0].id);
              } else {
                setError("No products available to edit yet.");
              }
            }}
          >
            <span className="product-action-card-title">Edit Product</span>
            <span className="product-action-card-copy">Choose a product below and open a prefilled edit modal.</span>
          </button>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {modalMode && (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <section className="modal-sheet panel stack" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{modalMode === "create" ? "Add Product" : "Edit Product"}</h2>
                <p className="subtle" style={{ marginBottom: 0 }}>
                  {modalMode === "create"
                    ? "Create a product in a focused form, then publish or keep it unlisted."
                    : "Loaded details are editable. Erase any field you want to change and resubmit."}
                </p>
              </div>
              <button type="button" className="modal-close" onClick={closeModal} disabled={isBusy} aria-label="Close product form">
                ×
              </button>
            </div>

            {modalMode === "create" ? (
              <form onSubmit={onCreate} className="field-grid">
                <label htmlFor="create-title">Title</label>
                <input id="create-title" placeholder="Title" value={createForm.title} onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))} required disabled={isBusy} />
                <label htmlFor="create-category">Category</label>
                <input id="create-category" placeholder="Category (western/south_asian etc.)" value={createForm.category} onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value }))} required disabled={isBusy} />
                <label htmlFor="create-description">Description</label>
                <textarea id="create-description" placeholder="Description" value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} disabled={isBusy} />
                <label htmlFor="create-base-price">Base wholesale price</label>
                <input id="create-base-price" placeholder="Base wholesale price" type="number" step="0.01" value={createForm.baseWholesalePrice} onChange={(event) => setCreateForm((current) => ({ ...current, baseWholesalePrice: event.target.value }))} required disabled={isBusy} />
                <fieldset className="size-picker">
                  <legend>Available sizes</legend>
                  <div className="size-chip-grid">
                    {SIZE_OPTIONS.map((sizeLabel) => {
                      const selected = createForm.availableSizes.includes(sizeLabel);
                      return (
                        <label key={sizeLabel} className={`size-chip ${selected ? "selected" : ""}`}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => setCreateForm((current) => ({ ...current, availableSizes: toggleSize(current.availableSizes, sizeLabel) }))}
                            disabled={isBusy}
                          />
                          <span>{sizeLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <label htmlFor="create-status">Availability status</label>
                <input id="create-status" placeholder="Availability status" value={createForm.availabilityStatus} onChange={(event) => setCreateForm((current) => ({ ...current, availabilityStatus: event.target.value }))} disabled={isBusy} />
                <div className="file-picker-card">
                  <div>
                    <label htmlFor="create-image-files">Product images from device <span className="required-mark">*</span></label>
                    <p className="file-help">Upload at least 1 image. Select up to 5 images at once, or choose again to add more.</p>
                  </div>
                  <input
                    id="create-image-files"
                    className="native-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    disabled={isBusy}
                    onChange={(event) => setCreateUploadFiles((current) => mergeSelectedProductImages(current, Array.from(event.target.files ?? [])))}
                  />
                  <label className={`file-picker-button ${isBusy ? "disabled" : ""}`} htmlFor="create-image-files">
                    Choose product images
                  </label>
                  <strong className="file-selection-summary">
                    {createUploadFiles.length > 0 ? `${createUploadFiles.length} image${createUploadFiles.length === 1 ? "" : "s"} selected` : "No images selected yet"}
                  </strong>
                  {createUploadFiles.length > 0 && (
                    <div className="file-chip-row" aria-live="polite">
                      {createUploadFiles.map((file, index) => (
                        <span className="file-chip" key={`${file.name}-${file.size}-${file.lastModified}`}>
                          {file.name}
                          <button type="button" disabled={isBusy} onClick={() => setCreateUploadFiles((current) => removeSelectedProductImage(current, index))}>
                            Remove
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <label className="checkbox-card" htmlFor="create-list-immediately">
                  <input
                    id="create-list-immediately"
                    type="checkbox"
                    checked={createForm.listImmediately}
                    onChange={(event) => setCreateForm((current) => ({ ...current, listImmediately: event.target.checked }))}
                    disabled={isBusy}
                  />
                  <span>
                    <strong>List immediately to resellers</strong>
                    <small>Default selected. Uncheck to onboard as unlisted and manually list later from PLP.</small>
                  </span>
                </label>
                {!isAdminSupabaseConfigured() && <p className="error">Image upload needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</p>}
                <div className="modal-actions">
                  <button type="button" className="secondary" onClick={closeModal} disabled={isBusy}>Cancel</button>
                  <button type="submit" disabled={isBusy}>
                    {busyOperation === "create" && <span className="spinner" aria-hidden="true" />}
                    {busyOperation === "create" ? "Creating product..." : "Create Product"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={onUpdate} className="field-grid">
                <label htmlFor="edit-product-selector">Select product</label>
                <select
                  id="edit-product-selector"
                  value={selectedEditProductId}
                  onChange={(event) => {
                    const nextProductId = event.target.value;
                    setSelectedEditProductId(nextProductId);
                    setDeleteConfirmArmed(false);
                    if (nextProductId) {
                      void prefillEditForm(nextProductId);
                    }
                  }}
                  disabled={isBusy}
                >
                  <option value="">Choose product</option>
                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title} · {product.id}
                    </option>
                  ))}
                </select>

                {updateForm.productId ? (
                  <>
                    <label htmlFor="update-title">Title</label>
                    <input id="update-title" placeholder="Title" value={updateForm.title} onChange={(event) => setUpdateForm((current) => ({ ...current, title: event.target.value }))} disabled={isBusy} />
                    <label htmlFor="update-category">Category</label>
                    <input id="update-category" placeholder="Category" value={updateForm.category} onChange={(event) => setUpdateForm((current) => ({ ...current, category: event.target.value }))} disabled={isBusy} />
                    <label htmlFor="update-description">Description</label>
                    <textarea id="update-description" placeholder="Description" value={updateForm.description} onChange={(event) => setUpdateForm((current) => ({ ...current, description: event.target.value }))} disabled={isBusy} />
                    <label htmlFor="update-base-price">Base wholesale price</label>
                    <input id="update-base-price" placeholder="Base wholesale price" type="number" step="0.01" value={updateForm.baseWholesalePrice} onChange={(event) => setUpdateForm((current) => ({ ...current, baseWholesalePrice: event.target.value }))} disabled={isBusy} />
                    <fieldset className="size-picker">
                      <legend>Available sizes</legend>
                      <div className="size-chip-grid">
                        {SIZE_OPTIONS.map((sizeLabel) => {
                          const selected = updateForm.availableSizes.includes(sizeLabel);
                          return (
                            <label key={sizeLabel} className={`size-chip ${selected ? "selected" : ""}`}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => setUpdateForm((current) => ({ ...current, availableSizes: toggleSize(current.availableSizes, sizeLabel) }))}
                                disabled={isBusy}
                              />
                              <span>{sizeLabel}</span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                    <label htmlFor="update-status">Availability status</label>
                    <input id="update-status" placeholder="Availability status" value={updateForm.availabilityStatus} onChange={(event) => setUpdateForm((current) => ({ ...current, availabilityStatus: event.target.value }))} disabled={isBusy} />
                    <label className="checkbox-card" htmlFor="update-arrival">
                      <input
                        id="update-arrival"
                        type="checkbox"
                        checked={updateForm.isNewArrival}
                        onChange={(event) => setUpdateForm((current) => ({ ...current, isNewArrival: event.target.checked }))}
                        disabled={isBusy}
                      />
                      <span>
                        <strong>Mark as new arrival</strong>
                        <small>Use when the style should stand out in buyer discovery surfaces.</small>
                      </span>
                    </label>

                    <div className="stack">
                      <strong>Current product images</strong>
                      {updateForm.currentImageUrls.length > 0 ? (
                        <div className="thumb-strip">
                          {updateForm.currentImageUrls.map((imageUrl) => (
                            <img key={imageUrl} src={imageUrl} alt={`${updateForm.title} asset`} loading="lazy" referrerPolicy="no-referrer" />
                          ))}
                        </div>
                      ) : (
                        <p className="subtle">No images uploaded yet.</p>
                      )}
                    </div>

                    <div className="file-picker-card">
                      <div>
                        <label htmlFor="update-image-files">Replace images from device</label>
                        <p className="file-help">Optional for editing. Selecting files will replace the current image set.</p>
                      </div>
                      <input
                        id="update-image-files"
                        className="native-file-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        disabled={isBusy}
                        onChange={(event) => setUpdateUploadFiles((current) => mergeSelectedProductImages(current, Array.from(event.target.files ?? [])))}
                      />
                      <label className={`file-picker-button ${isBusy ? "disabled" : ""}`} htmlFor="update-image-files">
                        Choose replacement images
                      </label>
                      <strong className="file-selection-summary">
                        {updateUploadFiles.length > 0 ? `${updateUploadFiles.length} image${updateUploadFiles.length === 1 ? "" : "s"} selected` : "No replacement images selected"}
                      </strong>
                      {updateUploadFiles.length > 0 && (
                        <div className="file-chip-row" aria-live="polite">
                          {updateUploadFiles.map((file, index) => (
                            <span className="file-chip" key={`${file.name}-${file.size}-${file.lastModified}`}>
                              {file.name}
                              <button type="button" disabled={isBusy} onClick={() => setUpdateUploadFiles((current) => removeSelectedProductImage(current, index))}>
                                Remove
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="modal-actions">
                      <button type="button" className="secondary" onClick={closeModal} disabled={isBusy}>Cancel</button>
                      <button type="button" className={`secondary danger-action ${deleteConfirmArmed ? "confirm-armed" : ""}`} onClick={() => void onDeleteProduct()} disabled={isBusy}>
                        {busyOperation === "delete" ? "Deleting..." : deleteConfirmArmed ? "Confirm delete" : "Delete product"}
                      </button>
                      <button type="submit" disabled={isBusy}>
                        {busyOperation === "update" && <span className="spinner" aria-hidden="true" />}
                        {busyOperation === "update" ? "Updating product..." : "Update Product"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="subtle">Select a product to load its current details into the edit form.</p>
                )}
              </form>
            )}
          </section>
        </div>
      )}

      {result && (
        <section className="panel">
          <h2>Latest Product Response</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}

      <section className="panel stack">
        <h2>All Uploaded Products</h2>
        <p>Use the edit action below to open the prefilled modal. Listing controls stay in the dedicated listed-products table.</p>
        {productsLoading && <p className="subtle">Loading catalog…</p>}
        {!productsLoading && activeProducts.length === 0 && <p className="subtle">No products available yet.</p>}
        <div className="product-admin-grid">
          {activeProducts.map((product) => (
            <article key={product.id} className="ai-card">
              <img src={product.coverImageUrl || product.imageUrls?.[0] || "https://image.pollinations.ai/prompt/minimal%20fashion%20placeholder%20image?width=1280&height=720&nologo=true"} alt={product.title} loading="lazy" referrerPolicy="no-referrer" />
              <div className="product-admin-body stack">
                <strong>{product.title}</strong>
                <span className="subtle">{product.id} • {product.category}</span>
                <span className="subtle">₹{product.baseWholesalePrice} • {(product.variants ?? []).map((variant) => variant.sizeLabel).join(", ") || "No sizes"}</span>
                <span className="status-chip">{product.availabilityStatus}</span>
                {product.imageUrls && product.imageUrls.length > 0 && (
                  <div className="thumb-strip">
                    {product.imageUrls.map((imageUrl) => (
                      <img key={`${product.id}-${imageUrl}`} src={imageUrl} alt={`${product.title} asset`} loading="lazy" referrerPolicy="no-referrer" />
                    ))}
                  </div>
                )}
                <div className="product-card-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => void prefillEditForm(product.id)}
                    disabled={isBusy}
                  >
                    Open edit modal
                  </button>
                  <Link href={`/products?edit=${encodeURIComponent(product.id)}`} className="inline-link">Open direct edit</Link>
                </div>
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
