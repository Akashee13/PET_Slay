"use client";

import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { getAdminSessionToken } from "@/src/features/auth/admin-session";
import { type AdminOrder, updateAdminOrderStatus } from "@/src/services/admin-api";

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const [status, setStatus] = useState("processing");
  const [result, setResult] = useState<AdminOrder | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAdminSessionToken();
    if (!token) {
      setError("Missing admin session token");
      return;
    }

    setError("");
    try {
      const updated = await updateAdminOrderStatus(token, params.orderId, status);
      setResult(updated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update order status");
    }
  }

  return (
    <main>
      <h1>Order {params.orderId}</h1>
      <p>Update order status through `/v1/admin/orders/{'{orderId}'}`.</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <label htmlFor="status">New Status</label>
        <select id="status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="processing">processing</option>
          <option value="shipped">shipped</option>
          <option value="delivered">delivered</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button type="submit">Update Status</button>
      </form>

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
      {result && (
        <pre style={{ marginTop: 12, background: "#f6f6f6", padding: 12, overflow: "auto" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
