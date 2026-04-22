import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';

// update based on your backend URL
const BASE_URL = "http://10.5.10.47:8080/AuthApp/AuthServlet";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email,
        password
      })
    });

    const data = await res.json();
    console.log("LOGIN RESPONSE:", data);

    if (data.success) {
      router.replace('/'); 
    } else {
      Alert.alert('Error', data.message);
    }

  } catch (err) {
    console.log("ERROR:", err);
    Alert.alert('Network error');
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Link href="/signup">
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F1C'
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 20
  },
  input: {
    width: '80%',
    backgroundColor: '#1C2433',
    color: '#FFFFFF',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: '80%',
    alignItems: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  link: {
    color: '#60A5FA',
    marginTop: 15
  }
});