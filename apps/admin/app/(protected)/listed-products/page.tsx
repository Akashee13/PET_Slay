"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getAdminSessionToken } from "@/src/features/auth/admin-session";
import { useAdminLanguage } from "@/src/features/i18n/admin-language";
import { type AdminProduct, listAdminProducts, updateProductListing } from "@/src/services/admin-api";

type ListingFilter = "all" | "listed" | "attention";
type SortMode = "newest" | "price_low" | "price_high";

const PRODUCT_PLACEHOLDER_IMAGE = "https://image.pollinations.ai/prompt/minimal%20fashion%20placeholder%20image?width=900&height=1200&nologo=true";

function formatVisibleUntil(value?: string): string {
  if (!value) {
    return "No expiry";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isExpired(product: AdminProduct): boolean {
  if (!product.visibleUntil) {
    return false;
  }
  return new Date(product.visibleUntil).getTime() <= Date.now();
}

function isListedForResellers(product: AdminProduct): boolean {
  return product.listingStatus === "listed" && !isExpired(product);
}

function getProductImages(product: AdminProduct): string[] {
  const uniqueImages = new Set<string>();
  if (product.coverImageUrl) {
    uniqueImages.add(product.coverImageUrl);
  }
  for (const imageUrl of product.imageUrls ?? []) {
    if (imageUrl) {
      uniqueImages.add(imageUrl);
    }
  }
  return uniqueImages.size > 0 ? Array.from(uniqueImages) : [PRODUCT_PLACEHOLDER_IMAGE];
}

function ProductImageCarousel({ images, product }: { images: string[]; product: AdminProduct }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);

    if (images.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, 2600);

    return () => window.clearInterval(intervalId);
  }, [images.length]);

  return (
    <div className="plp-carousel" aria-label={`${product.title} image gallery`}>
      <div className="plp-carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {images.map((imageUrl, index) => (
          <Link
            href={`/products/${product.id}`}
            className="plp-carousel-slide"
            aria-label={`Edit ${product.title}`}
            key={`${product.id}-${imageUrl}-${index}`}
          >
            <img
              src={imageUrl}
              alt={`${product.title} look ${index + 1}`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ListedProductsPage() {
  const { t } = useAdminLanguage();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ListingFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [busyProductId, setBusyProductId] = useState("");
  const [error, setError] = useState("");

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const listed = isListedForResellers(product);
      if (filter === "listed") {
        return listed;
      }
      if (filter === "attention") {
        return !listed;
      }
      return true;
    });

    return [...filtered].sort((left, right) => {
      if (sortMode === "price_low") {
        return left.baseWholesalePrice - right.baseWholesalePrice;
      }
      if (sortMode === "price_high") {
        return right.baseWholesalePrice - left.baseWholesalePrice;
      }
      return right.id.localeCompare(left.id);
    });
  }, [filter, products, sortMode]);

  const listedCount = products.filter((product) => product.listingStatus === "listed" && !isExpired(product)).length;
  const attentionCount = products.length - listedCount;

  async function loadProducts() {
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      setProducts(await listAdminProducts(token));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to fetch listed products");
    } finally {
      setLoading(false);
    }
  }

  async function onListingAction(productId: string, action: "list_now" | "unlist_now") {
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      return;
    }

    setBusyProductId(productId);
    setError("");
    try {
      const updated = await updateProductListing(token, productId, action);
      setProducts((current) => current.map((product) => (product.id === productId ? updated : product)));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update product listing");
    } finally {
      setBusyProductId("");
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  return (
    <main className="stack-lg">
      <section className="plp-hero">
        <div className="breadcrumb">Home / Admin / {t("listedProductsNav")}</div>
        <div className="plp-title-row">
          <div>
            <p className="eyebrow">{t("listedProductsEyebrow")}</p>
            <h1>{t("listedProductsTitle")}</h1>
            <p>{t("listedProductsSubtitle")}</p>
          </div>
          <button type="button" onClick={loadProducts} className="secondary">
            {t("refreshCatalog")}
          </button>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="plp-controls">
        <div className="collection-count">
          <strong>{products.length}</strong> products
          <span>{listedCount} listed</span>
          <span>{attentionCount} unlisted / need action</span>
        </div>
        <div className="plp-filter-row">
          <select value={filter} onChange={(event) => setFilter(event.target.value as ListingFilter)} aria-label="Filter products">
            <option value="all">All products</option>
            <option value="listed">Listed now</option>
            <option value="attention">Unlisted / need action</option>
          </select>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} aria-label="Sort products">
            <option value="newest">Sort: Newest</option>
            <option value="price_low">Price: Low to high</option>
            <option value="price_high">Price: High to low</option>
          </select>
        </div>
      </section>

      <section className="plp-board">
        {loading && <p className="subtle">Loading products...</p>}
        {!loading && visibleProducts.length === 0 && <p className="subtle">{t("productTableEmpty")}</p>}
        {!loading && visibleProducts.length > 0 && (
          <div className="plp-grid">
            {visibleProducts.map((product) => {
              const expired = isExpired(product);
              const listed = isListedForResellers(product);
              const listingAction = listed ? "unlist_now" : "list_now";
              const productImages = getProductImages(product);
              return (
                <article key={product.id} className="plp-card">
                  <ProductImageCarousel images={productImages} product={product} />
                  <div className="plp-card-body">
                    <div className="plp-card-copy">
                      <p>{product.category.replace("_", " ")}</p>
                      <h2>{product.title}</h2>
                      <span>₹{product.baseWholesalePrice} wholesale · MOQ {product.moq}</span>
                    </div>
                    <div className="plp-card-meta">
                      <span className={`status-chip ${listed ? "success" : "danger"}`}>
                        {listed ? "listed" : expired ? "expired" : product.listingStatus}
                      </span>
                      <small>{listed ? `Visible until ${formatVisibleUntil(product.visibleUntil)}` : "Hidden from resellers"}</small>
                    </div>
                    <div className="plp-actions">
                      <button
                        type="button"
                        className={listed ? "secondary danger-action" : "secondary"}
                        disabled={busyProductId === product.id}
                        onClick={() => onListingAction(product.id, listingAction)}
                      >
                        {busyProductId === product.id ? "Updating..." : listed ? t("unlistNow") : t("listNow")}
                      </button>
                      <Link href={`/products/${product.id}`} className="edit-product-tile">
                        <span>{t("editProduct")}</span>
                        <small>Pricing, MOQ, images</small>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
