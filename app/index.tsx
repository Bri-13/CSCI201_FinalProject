import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function Home() {
  return (
    <View>
      <Text>Home Page</Text>

      <Link href="/profile" asChild>
        <Pressable>
          <Text>Go to Profile</Text>
        </Pressable>
      </Link>

      <Link href="/login" asChild>
        <Pressable>
          <Text>Go to Login</Text>
        </Pressable>
      </Link>
    </View>
  );
}