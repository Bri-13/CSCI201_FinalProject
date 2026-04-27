import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { Feather, Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

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
      <View>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <Text style={styles.meta}>{item.meta}</Text>
        <Text style={styles.meta}>{item.description}</Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <StarRow rating={item.rating} />
        <Feather name="heart" size={18} />
      </View>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();

  const [userId, setUserId] = useState<number | null>(null);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [activeTab, setActiveTab] = useState<'recipes' | 'saved'>('recipes');

  // 🔐 Check login on load
  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const storedUser = await AsyncStorage.getItem('user_id');

    if (!storedUser) {
      router.replace('/login'); // redirect if not logged in
    } else {
      const id = Number(storedUser);
      setUserId(id);
      fetchRecipes(id);
    }
  };

  const fetchRecipes = async (id: number) => {
    try {
      const res = await fetch(
        `http://localhost:8080/YourApp/RecipeServlet?action=getUserRecipes&user_id=${id}`
      );

      const data = await res.json();

      const formatted = data.recipes.map((item: any) => ({
        title: item.recipe_name,
        meta: `${item.category} • ${item.difficulty} • ${
          item.prep_time + item.cook_time
        } min`,
        description: item.instructions?.substring(0, 60) + '...',
        rating: 4,
      }));

      setRecipes(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_id');
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ padding: 20 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.username}>Profile</Text>

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={{ color: 'white' }}>Logout</Text>
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            onPress={() => setActiveTab('recipes')}
            style={[
              styles.tabButton,
              activeTab === 'recipes' && styles.activeTab,
            ]}
          >
            <Text>Recipes</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('saved')}
            style={[
              styles.tabButton,
              activeTab === 'saved' && styles.activeTab,
            ]}
          >
            <Text>Saved</Text>
          </Pressable>
        </View>

        {/* Content */}
        {activeTab === 'recipes' ? (
          recipes.map((item, i) => <Recipe key={i} item={item} />)
        ) : (
          <Text style={{ textAlign: 'center' }}>
            Saved recipes not implemented yet
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3ece0',
  },
  header: {
    marginBottom: 20,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: '#cc4444',
    padding: 8,
    borderRadius: 8,
    width: 100,
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#d3dccb',
  },
  activeTab: {
    backgroundColor: '#b7d0a8',
  },
  recipe: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: '#666',
  },
  starRow: {
    flexDirection: 'row',
  },
});