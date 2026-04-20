import { Stack } from "expo-router";

import { BuyerAppProvider } from "../src/state/buyer-app-context";

export default function RootLayout() {
  return (
    <BuyerAppProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </BuyerAppProvider>
  );
}
