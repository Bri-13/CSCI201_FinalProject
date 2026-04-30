import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Feather, Octicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { clearUser, getUser, subscribe } from '../authStore';

type NavKey = 'home' | 'search' | 'profile';
type Props = { active?: NavKey };

export default function LeftNav({ active = 'home' }: Props) {
  const router = useRouter();
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const unsub = subscribe((u) => setUser(u));
    return unsub;
  }, []);

  const goHome    = () => router.push('/');
  const goProfile = () => router.push('/profile');

  // Search: go home and signal index.tsx to focus the search box.
  // Each click bumps the timestamp so repeat clicks still trigger focus.
  const goSearch  = () => router.push({ pathname: '/', params: { focus: 'search', t: String(Date.now()) } });

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            clearUser();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.leftNav}>
      {/* Logout button at top (only shown when logged in) */}
      {user ? (
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={16} color="#5a6653" />
        </Pressable>
      ) : (
        <View style={styles.logoutBtn} />
      )}

      {/* + Upload button — opens the create-recipe form */}
      <Pressable
        style={styles.navPlusButton}
        onPress={() => router.push('/recipe-edit')}
      >
        <Text style={styles.navPlusText}>+</Text>
      </Pressable>

      {/* Nav items */}
      <View style={styles.navGroup}>
        <Pressable
          style={styles.navItem}
          onPress={goProfile}
        >
          <View style={[styles.navCircle, active === 'profile' && styles.navCircleActive]}>
            <Feather name="user" size={18} color="#465143" />
          </View>
          <Text style={styles.navLabel}>Profile</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={goHome}
        >
          <View style={[styles.navCircle, active === 'home' && styles.navCircleActive]}>
            <Octicons name="home" size={16} color="#465143" />
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={goSearch}
        >
          <View style={[styles.navCircle, active === 'search' && styles.navCircleActive]}>
            <Feather name="search" size={16} color="#465143" />
          </View>
          <Text style={styles.navLabel}>Search</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const SIDEBAR_WIDTH = 76;

const styles = StyleSheet.create({
  leftNav: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#9eaf93',
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: 'center',
  },
  logoutBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  navPlusButton: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: '#c5d7bb',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 22,
  },
  navPlusText: {
    fontSize: 24, lineHeight: 24,
    color: '#65745d', fontWeight: '400',
  },
  navGroup: {
    width: '100%', alignItems: 'center', gap: 14,
  },
  navItem: {
    width: '100%', alignItems: 'center',
    paddingVertical: 4,
  },
  navCircle: {
    width: 42, height: 30, borderRadius: 14,
    backgroundColor: '#c5d7bb',
    alignItems: 'center', justifyContent: 'center',
  },
  navCircleActive: {
    backgroundColor: '#d9e7cd',
  },
  navLabel: {
    marginTop: 4, fontSize: 11, color: '#5a6653',
  },
});
