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
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>⌂</Text>
        </View>

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
  loginText: {
    color: '#D68C63',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
});