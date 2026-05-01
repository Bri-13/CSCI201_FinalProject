import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { hydrateAuth } from "../authStore";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  // Restore login state from AsyncStorage before rendering the rest of the app
  useEffect(() => {
    hydrateAuth().finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <Stack />;
}
