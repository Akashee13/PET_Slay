"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { clearAdminSessionToken, getAdminSessionToken, setAdminSessionToken } from "@/src/features/auth/admin-session";

export default function HomePage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  useEffect(() => {
    const existingToken = getAdminSessionToken();
    if (existingToken) {
      router.replace("/listed-products");
    }
  }, [router]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim()) {
      return;
    }

    setAdminSessionToken(token.trim());
    router.push("/listed-products");
  }

  function onClearSession() {
    clearAdminSessionToken();
    setToken("");
  }

  return (
    <main className="container stack-lg" style={{ paddingTop: 28 }}>
      <section className="card token-form stack">
        <p className="eyebrow">Stage Access</p>
        <h1 className="headline">PET_Slay Admin Console</h1>
        <p className="subtle">Paste the founder/admin bearer token to access product and order operations on stage.</p>

        <form onSubmit={onSubmit} className="stack">
          <label htmlFor="adminToken">Admin Bearer Token</label>
          <textarea
            id="adminToken"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            rows={4}
            placeholder="founder admin token"
          />
          <div className="row">
            <button type="submit">Continue to Admin</button>
            <button type="button" onClick={onClearSession} className="secondary">
              Clear Saved Token
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
