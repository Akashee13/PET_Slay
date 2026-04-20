"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AdminLanguage = "english" | "hindi" | "hinglish";

type AdminLanguageContextValue = {
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;
  t: (key: AdminCopyKey) => string;
};

type AdminCopyKey =
  | "operationsLanguage"
  | "ordersNav"
  | "productsNav"
  | "listedProductsNav"
  | "signOut"
  | "refreshCatalog"
  | "listedProductsEyebrow"
  | "listedProductsTitle"
  | "listedProductsSubtitle"
  | "productTableEmpty"
  | "listNow"
  | "unlistNow"
  | "editProduct"
  | "addProductEyebrow"
  | "addProductTitle"
  | "addProductSubtitle";

const STORAGE_KEY = "pet_slay_admin_language";

const COPY: Record<AdminLanguage, Record<AdminCopyKey, string>> = {
  english: {
    operationsLanguage: "Operations Language: English",
    ordersNav: "Order Operations",
    productsNav: "Add Product",
    listedProductsNav: "Listed Products",
    signOut: "Sign Out",
    refreshCatalog: "Refresh Catalog",
    listedProductsEyebrow: "Listing Control",
    listedProductsTitle: "Listed Products Table",
    listedProductsSubtitle: "Review every product, unlist stale styles, renew visibility for another 60 days, or edit details.",
    productTableEmpty: "No products available yet. If Supabase shows no tables, run the stage API deploy so migrations apply first.",
    listNow: "List now",
    unlistNow: "Unlist now",
    editProduct: "Edit product",
    addProductEyebrow: "Catalog Intake",
    addProductTitle: "Add New Product",
    addProductSubtitle: "Create products with pricing, MOQ, status, and up to 5 images. Listings auto-expire after 60 days unless renewed.",
  },
  hindi: {
    operationsLanguage: "ऑपरेशन भाषा: हिन्दी",
    ordersNav: "ऑर्डर ऑपरेशन",
    productsNav: "प्रोडक्ट जोड़ें",
    listedProductsNav: "लिस्टेड प्रोडक्ट्स",
    signOut: "साइन आउट",
    refreshCatalog: "कैटलॉग रिफ्रेश करें",
    listedProductsEyebrow: "लिस्टिंग कंट्रोल",
    listedProductsTitle: "लिस्टेड प्रोडक्ट्स टेबल",
    listedProductsSubtitle: "हर प्रोडक्ट देखें, पुराने स्टाइल अनलिस्ट करें, 60 दिन के लिए फिर से लिस्ट करें या डिटेल एडिट करें.",
    productTableEmpty: "अभी कोई प्रोडक्ट नहीं है. अगर Supabase में टेबल नहीं दिख रही हैं, पहले stage API deploy चलाकर migrations apply करें.",
    listNow: "अभी लिस्ट करें",
    unlistNow: "अभी अनलिस्ट करें",
    editProduct: "प्रोडक्ट एडिट करें",
    addProductEyebrow: "कैटलॉग इनटेक",
    addProductTitle: "नया प्रोडक्ट जोड़ें",
    addProductSubtitle: "कीमत, MOQ, status और 5 images तक के साथ product बनाएं. Listing 60 दिनों बाद expire होगी जब तक admin renew न करे.",
  },
  hinglish: {
    operationsLanguage: "Operations Language: Hinglish",
    ordersNav: "Order Operations",
    productsNav: "Product Add Karo",
    listedProductsNav: "Listed Products",
    signOut: "Sign Out",
    refreshCatalog: "Catalog Refresh Karo",
    listedProductsEyebrow: "Listing Control",
    listedProductsTitle: "Listed Products Table",
    listedProductsSubtitle: "Saare products review karo, stale styles unlist karo, 60 din ke liye relist karo, ya details edit karo.",
    productTableEmpty: "Abhi products nahi hain. Agar Supabase me tables nahi dikh rahi, pehle stage API deploy chalao taaki migrations apply ho.",
    listNow: "List now",
    unlistNow: "Unlist now",
    editProduct: "Product edit karo",
    addProductEyebrow: "Catalog Intake",
    addProductTitle: "New Product Add Karo",
    addProductSubtitle: "Price, MOQ, status aur max 5 images ke saath product create karo. Listing 60 din baad expire hogi jab tak admin renew na kare.",
  },
};

const AdminLanguageContext = createContext<AdminLanguageContextValue | null>(null);

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AdminLanguage>("english");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (isAdminLanguage(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const value = useMemo<AdminLanguageContextValue>(
    () => ({
      language,
      setLanguage(nextLanguage) {
        setLanguageState(nextLanguage);
        window.localStorage.setItem(STORAGE_KEY, nextLanguage);
      },
      t(key) {
        return COPY[language][key];
      },
    }),
    [language],
  );

  return <AdminLanguageContext.Provider value={value}>{children}</AdminLanguageContext.Provider>;
}

export function useAdminLanguage(): AdminLanguageContextValue {
  const context = useContext(AdminLanguageContext);
  if (!context) {
    throw new Error("useAdminLanguage must be used inside AdminLanguageProvider");
  }
  return context;
}

export function isAdminLanguage(value: string | null): value is AdminLanguage {
  return value === "english" || value === "hindi" || value === "hinglish";
}
