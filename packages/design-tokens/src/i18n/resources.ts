export type AppLanguage = "english" | "hindi" | "hinglish";

export const translationResources = {
  english: {
    appName: "PET_Slay",
    resellerWelcome: "Fresh fashion for your next restock",
    adminWelcome: "Manage catalog, orders, and campaigns",
    newArrivals: "New Arrivals",
    trendingNow: "Trending Now",
    placeOrder: "Place Order"
  },
  hindi: {
    appName: "PET_Slay",
    resellerWelcome: "Apne agle restock ke liye naye fashion styles",
    adminWelcome: "Catalog, orders aur campaigns manage karein",
    newArrivals: "Naye arrivals",
    trendingNow: "Abhi trend mein",
    placeOrder: "Order place karein"
  },
  hinglish: {
    appName: "PET_Slay",
    resellerWelcome: "Agle restock ke liye fresh fashion picks",
    adminWelcome: "Catalog, orders aur campaigns ko easily manage karo",
    newArrivals: "Fresh arrivals",
    trendingNow: "Trending picks",
    placeOrder: "Order place karo"
  }
} as const;

export type TranslationKey = keyof (typeof translationResources)["english"];
