"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getAdminSessionToken } from "@/src/features/auth/admin-session";
import { useAdminLanguage } from "@/src/features/i18n/admin-language";
import { type AdminProduct, listAdminProducts, updateProductListing } from "@/src/services/admin-api";

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

export default function ListedProductsPage() {
  const { t } = useAdminLanguage();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyProductId, setBusyProductId] = useState("");
  const [error, setError] = useState("");

  const sortedProducts = useMemo(
    () => [...products].sort((left, right) => right.id.localeCompare(left.id)),
    [products],
  );

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
      <section className="toolbar">
        <div>
          <p className="eyebrow">{t("listedProductsEyebrow")}</p>
          <h1 className="headline">{t("listedProductsTitle")}</h1>
          <p className="subtle">{t("listedProductsSubtitle")}</p>
        </div>
        <button type="button" onClick={loadProducts} className="secondary">
          {t("refreshCatalog")}
        </button>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="panel stack">
        {loading && <p className="subtle">Loading catalog table...</p>}
        {!loading && sortedProducts.length === 0 && <p className="subtle">{t("productTableEmpty")}</p>}
        {!loading && sortedProducts.length > 0 && (
          <div className="table-shell">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Price / MOQ</th>
                  <th>Listing</th>
                  <th>Visible until</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => {
                  const expired = isExpired(product);
                  const listed = product.listingStatus === "listed" && !expired;
                  return (
                    <tr key={product.id}>
                      <td>
                        <img
                          className="table-thumb"
                          src={product.coverImageUrl || product.imageUrls?.[0] || "https://image.pollinations.ai/prompt/minimal%20fashion%20placeholder%20image?width=512&height=512&nologo=true"}
                          alt={product.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td>
                        <strong>{product.title}</strong>
                        <span className="table-meta">{product.id}</span>
                        <span className="table-meta">{product.category}</span>
                      </td>
                      <td>
                        <strong>₹{product.baseWholesalePrice}</strong>
                        <span className="table-meta">MOQ {product.moq}</span>
                      </td>
                      <td>
                        <span className={`status-chip ${listed ? "success" : "danger"}`}>
                          {listed ? "listed" : expired ? "expired" : product.listingStatus}
                        </span>
                      </td>
                      <td>{formatVisibleUntil(product.visibleUntil)}</td>
                      <td>
                        <div className="action-stack">
                          <button
                            type="button"
                            className="secondary"
                            disabled={busyProductId === product.id}
                            onClick={() => onListingAction(product.id, "list_now")}
                          >
                            {t("listNow")}
                          </button>
                          <button
                            type="button"
                            className="secondary danger-action"
                            disabled={busyProductId === product.id}
                            onClick={() => onListingAction(product.id, "unlist_now")}
                          >
                            {t("unlistNow")}
                          </button>
                          <Link href={`/products/${product.id}`} className="inline-link">
                            {t("patchProduct")}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
