"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { clearAdminSessionToken, getAdminSessionToken } from "@/src/features/auth/admin-session";

type ThemeMode = "light" | "dusk";
type LanguageCode = "english" | "hindi" | "hinglish";

const LANGUAGE_OPTIONS: Array<{ value: LanguageCode; label: string }> = [
  { value: "english", label: "English" },
  { value: "hindi", label: "हिन्दी" },
  { value: "hinglish", label: "Hinglish" },
];

const LANGUAGE_BADGE: Record<LanguageCode, string> = {
  english: "Operations Language: English",
  hindi: "ऑपरेशन भाषा: हिन्दी",
  hinglish: "Operations Language: Hinglish",
};

function applyTheme(themeMode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", themeMode);
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dusk");
  const [languageCode, setLanguageCode] = useState<LanguageCode>("english");

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

    const savedLanguage = window.localStorage.getItem("pet_slay_admin_language");
    if (savedLanguage === "hindi" || savedLanguage === "hinglish" || savedLanguage === "english") {
      setLanguageCode(savedLanguage);
    }

    setReady(true);
  }, [router]);

  function onToggleTheme() {
    const nextTheme: ThemeMode = themeMode === "light" ? "dusk" : "light";
    setThemeMode(nextTheme);
    window.localStorage.setItem("pet_slay_admin_theme", nextTheme);
    applyTheme(nextTheme);
  }

  function onLanguageChange(nextLanguage: string) {
    if (nextLanguage !== "english" && nextLanguage !== "hindi" && nextLanguage !== "hinglish") {
      return;
    }

    setLanguageCode(nextLanguage);
    window.localStorage.setItem("pet_slay_admin_language", nextLanguage);
  }

  const navItems = useMemo(
    () => [
      { href: "/orders", label: "Order Operations" },
      { href: "/products", label: "Catalog Operations" },
    ],
    []
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
            <p className="subtle">{LANGUAGE_BADGE[languageCode]}</p>
          </div>
        </div>
        <nav className="nav-row">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
          <select value={languageCode} onChange={(event) => onLanguageChange(event.target.value)} aria-label="Select language">
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
            Sign Out
          </button>
        </nav>
      </header>
      <section className="stack-lg">{children}</section>
    </div>
  );
}
