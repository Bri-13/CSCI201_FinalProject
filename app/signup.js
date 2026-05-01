import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BASE_URL as API_BASE } from '../api';

const BASE_URL = `${API_BASE}/AuthServlet`;

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignup = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', username, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        Alert.alert('Success', 'Account created!');
        router.replace('/login');
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Server error');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/login-bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Pressable style={[styles.logoWrap, { zIndex: 10 }]} onPress={() => router.replace('/')}>
          <Image source={require('../assets/images/homebite-logo.png')} style={styles.logoImg} />
        </Pressable>

        <View style={styles.content}>
          <Text style={styles.title}>Create your account.</Text>

          <TextInput
            placeholder="Username"
            placeholderTextColor="#B9B9B9"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />

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
            <Pressable style={styles.button} onPress={handleSignup}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </Pressable>

            <Link href="/login" asChild>
              <Pressable>
                <Text style={styles.loginText}>or Login</Text>
              </Pressable>
            </Link>
          </View>

          <Pressable onPress={() => router.replace('/')} style={{ zIndex: 10 }}>
              <Text style={styles.guestText}>
                Continue as <Text style={styles.guestBold}>Guest</Text>
              </Text>
          </Pressable>

        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: 28,
    paddingTop: 30,
  },
  logoWrap: {
    marginTop: -10,
    marginLeft: 6,
    zIndex: 10,
  },
  logoImg: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -120,
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
    width: '78%',
    maxWidth: 360,
  },
  button: {
    width: '70%',
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
  loginText: {
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
  guestBold: {
    color: '#D68C63',
    fontSize: 15,
    fontWeight: '700',
  },
});