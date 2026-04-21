"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();

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
          Open the main products screen and use the edit modal for the updated admin workflow.
        </p>
        <div className="row">
          <Link href="/products" className="button-link">
            Open Product Operations
          </Link>
          <Link href="/listed-products" className="button-link">
            Open Listed Products
          </Link>
        </div>
      </section>
    </main>
  );
}
