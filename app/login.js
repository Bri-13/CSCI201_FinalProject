import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { setUser } from '../authStore';
import { BASE_URL as API_BASE } from '../api';

const BASE_URL = `${API_BASE}/AuthServlet`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });

      const data = await res.json();
      console.log('LOGIN RESPONSE:', data);

      if (data.success) {
        setUser({ username: data.username || email.split('@')[0], email });
        router.replace('/');
      } else {
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (err) {
      console.log('ERROR:', err);
      Alert.alert('Network error');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/login-bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>⌂</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Cook the day gently.</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#B9B9B9"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#B9B9B9"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.actionRow}>
            <Pressable style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>

            <Link href="/signup" asChild>
              <Pressable>
                <Text style={styles.signupText}>or Sign up</Text>
              </Pressable>
            </Link>
          </View>

          <Pressable onPress={() => router.replace('/')}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: 28,
    paddingTop: 70,
  },
  logoWrap: {
    marginTop: 10,
    marginLeft: 6,
  },
  logo: {
    fontSize: 38,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 26,
    textAlign: 'center',
  },
  input: {
    width: '78%',
    maxWidth: 360,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 28,
    paddingHorizontal: 20,
    fontSize: 17,
    color: '#333333',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  button: {
    width: 215,
    maxWidth: '78%',
    height: 50,
    borderRadius: 28,
    backgroundColor: '#8FAE8A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  signupText: {
    color: '#D68C63',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  guestText: {
    color: '#D68C63',
    fontSize: 15,
    marginTop: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
});