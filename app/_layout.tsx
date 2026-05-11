import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";
import { hydrateAuth } from "../authStore";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    hydrateAuth().finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="profile"
        options={{
          title: 'profile',
          headerLeft: () => (
            <Pressable onPress={() => router.replace('/')} style={{ marginRight: 8 }}>
              <Text style={{ fontSize: 24, color: '#465143', lineHeight: 28 }}>←</Text>
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
