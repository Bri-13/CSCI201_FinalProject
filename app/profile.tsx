import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getUser, subscribe, clearUser } from '../authStore';
import { BASE_URL as API_BASE } from '../api';

type RecipeItem = {
  title: string;
  meta: string;
  description: string;
  rating: number;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Octicons
          key={idx}
          name={idx < rating ? 'star-fill' : 'star'}
          size={16}
          color="#5e5967"
        />
      ))}
    </View>
  );
}

function Recipe({ item }: { item: RecipeItem }) {
  return (
    <View style={styles.recipe}>
      <View style={styles.recipeLeft}>
        <View style={styles.recipeThumbnail}>
          <Text style={styles.recipeThumbnailEmoji}>🍽️</Text>
        </View>
        <View style={styles.recipeText}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
          <Text style={styles.meta}>{item.meta}</Text>
          <Text style={styles.meta}>{item.description}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <StarRow rating={item.rating} />
        <Feather name="heart" size={18} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

// Decorative strawberry illustration for the hero banner
function HeroIllustration() {
  return (
    <View style={styles.heroIllustration} pointerEvents="none">
      <Text style={[styles.heroEmoji, { fontSize: 130, top: 20, right: 10 }]}>🍓</Text>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();

  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<RecipeItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'recipes' | 'saved'>(
    tab === 'saved' ? 'saved' : 'recipes'
  );
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Bio lives only in memory — intentionally not persisted, clears on logout
  const [bio, setBio] = useState<string>('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [bioInput, setBioInput] = useState<string>('');

  useEffect(() => {
    init();
    const unsub = subscribe((u) => {
      if (u) {
        setUsername(u.username);
        setEmail(u.email);
      }
    });
    return unsub;
  }, []);

  const init = async () => {
    const storeUser = getUser();
    if (storeUser) {
      setUserId(storeUser.user_id);
      setUsername(storeUser.username);
      setEmail(storeUser.email);
      fetchRecipes(storeUser.user_id);
      fetchSavedRecipes(storeUser.user_id);
      if (!storeUser.username || !storeUser.email) {
        fetchProfile(storeUser.user_id);
      }
      return;
    }
    const storedId = await AsyncStorage.getItem('user_id');
    if (!storedId) {
      router.replace('/login');
      return;
    }
    const id = Number(storedId);
    setUserId(id);
    fetchProfile(id);
    fetchRecipes(id);
    fetchSavedRecipes(id);
  };

  const fetchProfile = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/AuthServlet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getProfile', user_id: id }),
      });
      const data = await res.json();
      if (data.success) {
        setUsername(data.username || '');
        setEmail(data.email || '');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  // ✅ CONNECTED TO SavedRecipeServlet
  const fetchSavedRecipes = async (id: number) => {
    setSavedLoading(true);
    try {
      const url = `${API_BASE}/SavedRecipeServlet?action=getSavedRecipes&user_id=${id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) {
        console.error('SavedRecipeServlet error:', data);
        return;
      }
      const formatted = data.recipes.map((item: any) => ({
        title: item.recipe_name,
        meta: `${item.category} • ${item.difficulty} • ${item.prep_time + item.cook_time} min`,
        description: item.instructions?.substring(0, 60) + '...',
        rating: 4,
      }));
      setSavedRecipes(formatted);
    } catch (err) {
      console.error('Failed to fetch saved recipes:', err);
    } finally {
      setSavedLoading(false);
    }
  };

  const fetchRecipes = async (id: number) => {
    try {
      const url =
        `${API_BASE}/RecipeServlet` +
        `?action=getUserRecipes&user_id=${id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) {
        console.error('Backend error:', data);
        return;
      }
      const formatted = data.recipes.map((item: any) => ({
        title: item.recipe_name,
        meta: `${item.category} • ${item.difficulty} • ${item.prep_time + item.cook_time} min`,
        description: item.instructions?.substring(0, 60) + '...',
        rating: 4,
      }));
      setRecipes(formatted);
    } catch (err) {
      console.error('Fetch failed:', err);
    }
  };

  // Logout also clears bio since it is session-only
  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_id');
    clearUser();
    setBio('');
    router.replace('/login');
  };

  const openEditModal = () => {
    setBioInput(bio);
    setEditModalVisible(true);
  };

  const handleSaveBio = () => {
    setBio(bioInput);
    setEditModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Edit Bio Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Bio</Text>
            <TextInput
              style={styles.modalInput}
              value={bioInput}
              onChangeText={setBioInput}
              placeholder="Write something about yourself…"
              placeholderTextColor="#aaa"
              multiline
              maxLength={160}
            />
            <Text style={styles.charCount}>{bioInput.length}/160</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveBio}
              >
                <Text style={styles.modalBtnSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <HeroIllustration />
          <View style={styles.heroFade} />
          <View style={styles.heroContent}>
            <Text style={styles.heroUsername}>{username || 'Profile'}</Text>
            <Text style={styles.heroBio}>
              {bio || email || 'No bio yet — tap Edit Profile to add one.'}
            </Text>
            <View style={styles.heroButtons}>
              <Pressable style={styles.btnEditProfile} onPress={openEditModal}>
                <Feather name="edit-2" size={13} color="#303030" style={{ marginRight: 5 }} />
                <Text style={styles.btnEditProfileText}>Edit Profile</Text>
              </Pressable>
              <Pressable style={styles.btnLogout} onPress={handleLogout}>
                <Feather name="log-out" size={13} color="#cc4444" style={{ marginRight: 5 }} />
                <Text style={styles.btnLogoutText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            onPress={() => setActiveTab('recipes')}
            style={[styles.tabButton, activeTab === 'recipes' && styles.activeTab]}
          >
            {activeTab === 'recipes' && (
              <Feather name="check" size={13} color="#fff" style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.tabText, activeTab === 'recipes' && styles.activeTabText]}>
              Recipes
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('saved')}
            style={[styles.tabButton, activeTab === 'saved' && styles.activeTab]}
          >
            {activeTab === 'saved' && (
              <Feather name="check" size={13} color="#fff" style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
              Saved
            </Text>
          </Pressable>
        </View>

        {/* Recipe List */}
        <View style={styles.listContainer}>
          {activeTab === 'recipes' ? (
            recipes.length > 0 ? (
              recipes.map((item, i) => <Recipe key={i} item={item} />)
            ) : (
              <Text style={styles.emptyText}>No recipes posted yet.</Text>
            )
          ) : savedLoading ? (
            <Text style={styles.emptyText}>Loading saved recipes…</Text>
          ) : savedRecipes.length > 0 ? (
            savedRecipes.map((item, i) => <Recipe key={i} item={item} />)
          ) : (
            <Text style={styles.emptyText}>No saved recipes yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3ece0',
  },

  // Hero Banner
  heroBanner: {
    height: 200,
    backgroundColor: '#ddd8e8',
    overflow: 'hidden',
    position: 'relative',
  },
  heroIllustration: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  heroEmoji: {
    position: 'absolute',
    opacity: 0.55,
  },
  heroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(221,216,232,0.7)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 18,
    left: 20,
    right: 20,
  },
  heroUsername: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  heroBio: {
    fontSize: 13,
    color: '#444',
    marginBottom: 12,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  btnEditProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  btnEditProfileText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#303030',
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8b4b4',
  },
  btnLogoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cc4444',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 20,
    backgroundColor: '#d3dccb',
  },
  activeTab: {
    backgroundColor: '#7fa870',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#303030',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '700',
  },

  // Recipe List
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  recipe: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  recipeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  recipeThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#e8e0d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#d5cdc0',
  },
  recipeThumbnailEmoji: {
    fontSize: 22,
  },
  recipeText: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  meta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
    fontSize: 14,
  },

  // Edit Bio Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#303030',
    minHeight: 90,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
  },
  charCount: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalBtnCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modalBtnSave: {
    backgroundColor: '#7fa870',
  },
  modalBtnSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});