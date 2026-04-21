"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!params.productId) {
      router.replace("/products");
      return;
    }

    router.replace(`/products?edit=${encodeURIComponent(params.productId)}`);
  }, [params.productId, router]);

  return (
    <main className="stack-lg">
      <section className="toolbar">
        <div>
          <p className="eyebrow">Product Redirect</p>
          <h1 className="headline">Use the Product Operations hub</h1>
          <p className="subtle">Product editing now happens in a prefilled modal on the main products page.</p>
        </div>
      </section>

      <section className="panel stack">
        <strong>Product ID: {params.productId}</strong>
        <p className="subtle" style={{ margin: 0 }}>
          Redirecting you to the Product Operations edit modal.
        </p>
      </section>
    </main>
  );
}
