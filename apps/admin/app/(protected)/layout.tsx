"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { clearAdminSessionToken, getAdminSessionToken } from "@/src/features/auth/admin-session";
import { AdminLanguageProvider, isAdminLanguage, useAdminLanguage, type AdminLanguage } from "@/src/features/i18n/admin-language";

type ThemeMode = "light" | "dusk";

const LANGUAGE_OPTIONS: Array<{ value: AdminLanguage; label: string }> = [
  { value: "english", label: "English" },
  { value: "hindi", label: "हिन्दी" },
  { value: "hinglish", label: "Hinglish" },
];

function applyTheme(themeMode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", themeMode);
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AdminLanguageProvider>
      <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
    </AdminLanguageProvider>
  );
}

function ProtectedLayoutInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t } = useAdminLanguage();
  const [ready, setReady] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dusk");

  useEffect(() => {
    const token = getAdminSessionToken();
    if (!token) {
      router.replace("/");
      return;
    }

    const savedTheme = window.localStorage.getItem("pet_slay_admin_theme");
    const nextTheme = savedTheme === "light" ? "light" : "dusk";
    setThemeMode(nextTheme);
    applyTheme(nextTheme);

    setReady(true);
  }, [router]);

  function onToggleTheme() {
    const nextTheme: ThemeMode = themeMode === "light" ? "dusk" : "light";
    setThemeMode(nextTheme);
    window.localStorage.setItem("pet_slay_admin_theme", nextTheme);
    applyTheme(nextTheme);
  }

  function onLanguageChange(nextLanguage: string) {
    if (!isAdminLanguage(nextLanguage)) {
      return;
    }

    setLanguage(nextLanguage);
  }

  const navItems = useMemo(
    () => [
      { href: "/listed-products", label: t("listedProductsNav") },
      { href: "/products", label: t("productsNav") },
      { href: "/orders", label: t("ordersNav") },
    ],
    [t]
  );

  if (!ready) {
    return <main className="container">Checking admin session…</main>;
  }

  return (
    <div className="container stack-lg" style={{ paddingTop: 20 }}>
      <header className="topbar spread">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="img" focusable="false">
              <defs>
                <linearGradient id="petSlayGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2dd4bf" />
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#petSlayGradient)" />
              <path d="M17 42V22h15c6 0 10 3 10 8s-4 8-10 8h-6v4h-9zm9-11h5c2 0 3-1 3-3s-1-3-3-3h-5v6zm20 11-8-9h8l9 9h-9z" fill="#0b1020" />
            </svg>
          </div>
          <div>
            <strong>PET_Slay Command Desk</strong>
            <p className="subtle">{t("operationsLanguage")}</p>
          </div>
        </div>
        <nav className="nav-row">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
          <select value={language} onChange={(event) => onLanguageChange(event.target.value)} aria-label="Select language">
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="button" className="secondary" onClick={onToggleTheme}>
            Theme: {themeMode === "light" ? "Light" : "Dusk"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              clearAdminSessionToken();
              router.push("/");
            }}
          >
            {t("signOut")}
          </button>
        </nav>
      </header>
      <section className="stack-lg">{children}</section>
    </div>
  );
}
