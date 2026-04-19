"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { clearAdminSessionToken, getAdminSessionToken } from "@/src/features/auth/admin-session";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAdminSessionToken();
    if (!token) {
      router.replace("/");
      return;
    }

    setReady(true);
  }, [router]);

  const navItems = useMemo(
    () => [
      { href: "/orders", label: "Orders" },
      { href: "/products", label: "Products" },
    ],
    []
  );

  if (!ready) {
    return <main className="container">Checking admin session…</main>;
  }

  return (
    <div className="container stack-lg" style={{ paddingTop: 20 }}>
      <header className="topbar spread">
        <strong>PET_Slay Operations Console</strong>
        <nav className="nav-row">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            className="secondary"
            onClick={() => {
              clearAdminSessionToken();
              router.push("/");
            }}
          >
            Sign Out
          </button>
        </nav>
      </header>
      <section className="stack-lg">{children}</section>
    </div>
  );
}
