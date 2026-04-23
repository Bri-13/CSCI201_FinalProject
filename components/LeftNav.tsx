import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather, Octicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type NavKey = 'home' | 'search' | 'profile';

type Props = {
  active?: NavKey;
};

export default function LeftNav({ active = 'home' }: Props) {
  const router = useRouter();

  const goHome    = () => router.push('/');
  const goProfile = () => router.push('/profile');
  // Search is inline on home page — tapping just goes home and focuses feed
  const goSearch  = () => router.push('/');
  const goUpload  = () => { /* TODO: recipe-create page — Alex */ };

  return (
    <View style={styles.leftNav}>
      <View style={styles.menuIconWrap}>
        <Feather name="menu" size={22} color="#4d4d4d" />
      </View>

      <Pressable style={styles.navPlusButton} onPress={goUpload}>
        <Text style={styles.navPlusText}>+</Text>
      </Pressable>

      <View style={styles.navGroup}>
        <Pressable
          style={[styles.navItem, active === 'profile' && styles.navItemActive]}
          onPress={goProfile}
        >
          <View style={[styles.navCircle, active === 'profile' && styles.navCircleActive]}>
            <Feather name="user" size={18} color="#465143" />
          </View>
          <Text style={styles.navLabel}>Profile</Text>
        </Pressable>

        <Pressable
          style={[styles.navItem, active === 'home' && styles.navItemActive]}
          onPress={goHome}
        >
          <View style={[styles.navCircle, active === 'home' && styles.navCircleActive]}>
            <Octicons name="home" size={16} color="#465143" />
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={[styles.navItem, active === 'search' && styles.navItemActive]}
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
  menuIconWrap: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
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
  navItemActive: {
    opacity: 1,
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
