"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getAdminSessionToken } from "@/src/features/auth/admin-session";
import { listAdminOrders, type AdminOrder, updateAdminOrderStatus } from "@/src/services/admin-api";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const OPERATIONS_AI_SHOTS = [
  {
    label: "Fulfilment route planner",
    prompt: "warehouse fulfilment dashboard ui, route planner, packages and shelves, premium enterprise design"
  },
  {
    label: "Dispatch status board",
    prompt: "order dispatch control center screen, ecommerce warehouse, modern cards, blue dark theme"
  },
  {
    label: "Quality check station",
    prompt: "fashion warehouse quality check workflow ui, clean app design, realistic operations context"
  }
] as const;

function buildAiImageUrl(prompt: string): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&enhance=true`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const items = await listAdminOrders(token);
      setOrders(items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }

  async function onUpdateStatus(orderId: string, status: string) {
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      return;
    }

    try {
      const updated = await updateAdminOrderStatus(token, orderId, status);
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update order status");
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  return (
    <main className="stack">
      <section className="toolbar">
        <div>
          <p className="eyebrow">Fulfilment Desk</p>
          <h1 className="headline">Order Queue</h1>
          <p className="subtle">Connected to `/v1/admin/orders` and `/v1/admin/orders/{'{orderId}'}`.</p>
        </div>
      </section>

      <section className="hero-panel stack">
        <h2 style={{ margin: 0 }}>Shipment Workflow Theme</h2>
        <p className="subtle">Command-center feel with quick status controls and high-contrast operational readability.</p>
        <div className="kpi-grid">
          <div className="kpi"><strong>{orders.length}</strong><span className="subtle">Orders loaded</span></div>
          <div className="kpi"><strong>{ORDER_STATUSES.length}</strong><span className="subtle">Lifecycle states</span></div>
          <div className="kpi"><strong>Live API</strong><span className="subtle">Stage-connected queue</span></div>
          <div className="kpi"><strong>AI Scene Kit</strong><span className="subtle">Fulfilment references</span></div>
        </div>
      </section>

      <div className="row">
        <button type="button" onClick={loadOrders}>
          Refresh Orders
        </button>
      </div>

      {loading && <p>Loading orders…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && orders.length === 0 && <p>No orders available yet.</p>}

      <div className="order-list">
        {orders.map((order) => (
          <article key={order.id} className="card stack">
            <div className="spread">
              <div>
                <strong>{order.id}</strong>
                <div className="subtle">Total: ₹{order.totalAmount}</div>
                <span className="status-chip">{order.status}</span>
              </div>
              <div className="row">
                <select
                  defaultValue={order.status}
                  onChange={(event) => {
                    void onUpdateStatus(order.id, event.target.value);
                  }}
                  style={{ minWidth: 160 }}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <Link href={`/orders/${order.id}`} className="inline-link">Open</Link>
              </div>
            </div>
            <ul className="order-items">
              {order.items.map((item, index) => (
                <li key={`${order.id}-${index}`}>
                  {item.productId} x {item.quantity} @ ₹{item.unitPrice}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="panel stack">
        <h2>AI Visual Direction</h2>
        <p>Generated concept scenes for fulfilment and dispatch flows.</p>
        <div className="ai-gallery">
          {OPERATIONS_AI_SHOTS.map((shot) => (
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
