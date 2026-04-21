import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';

type RecipeItem = {
  title: string;
  meta: string;
  description: string;
  rating: number;
};

const RECIPES: RecipeItem[] = [
  {
    title: 'Recipe',
    meta: 'Category • Level of Difficulty • Time Estimate',
    description: 'Brief Overview of Dish',
    rating: 5,
  },
  {
    title: 'Recipe',
    meta: 'Category • Level of Difficulty • Time Estimate',
    description: 'Brief Overview of Dish',
    rating: 5,
  },
  {
    title: 'Recipe',
    meta: 'Category • Level of Difficulty • Time Estimate',
    description: 'Brief Overview of Dish',
    rating: 5,
  },
  {
    title: 'Recipe',
    meta: 'Category • Level of Difficulty • Time Estimate',
    description: 'Brief Overview of Dish',
    rating: 5,
  },
  {
    title: 'Recipe',
    meta: 'Category • Level of Difficulty • Time Estimate',
    description: 'Brief Overview of Dish',
    rating: 5,
  },
  {
    title: 'Recipe',
    meta: 'Category • Level of Difficulty • Time Estimate',
    description: 'Brief Overview of Dish',
    rating: 5,
  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Octicons
          key={idx}
          name={idx < rating ? 'star-fill' : 'star'}
          size={16}
          color="#5e5967"
          style={styles.star}
        />
      ))}
    </View>
  );
}

function LeftNav() {
  return (
    <View style={styles.leftNav}>
      <View style={styles.menuIconWrap}>
        <Feather name="menu" size={22} color="#4d4d4d" />
      </View>

      <Pressable style={styles.navPlusButton}>
        <Text style={styles.navPlusText}>+</Text>
      </Pressable>

      <View style={styles.navGroup}>
        <Pressable style={[styles.navItem, styles.navItemActive]}>
          <View style={styles.navCircle}>
            <Feather name="user" size={18} color="#465143" />
          </View>
          <Text style={styles.navLabel}>Profile</Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <View style={styles.navCircle}>
            <Octicons name="home" size={16} color="#465143" />
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <View style={styles.navCircle}>
            <Feather name="search" size={16} color="#465143" />
          </View>
          <Text style={styles.navLabel}>Search</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProfileHeader() {
  return (
    <View style={styles.profileHeaderCard}>
      <View style={styles.bannerArtwork}>
        <View style={[styles.bannerShape, styles.bannerShapeTriangle]} />
        <View style={[styles.bannerShape, styles.bannerShapeCog]}>
          <MaterialCommunityIcons name="shape" size={34} color="#b8b3be" />
        </View>
        <View style={[styles.bannerShape, styles.bannerShapeSquare]} />
      </View>

      <View style={styles.profileContentRow}>
        <View style={styles.profileIdentityBlock}>
          <Text style={styles.username}>Username</Text>
          <Text style={styles.bioText}>Bio Description</Text>

          <View style={styles.buttonRow}>
            <Pressable style={styles.actionButton}>
              <Feather name="edit-2" size={14} color="#4f4f4f" />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </Pressable>

            <Pressable style={styles.actionButton}>
              <Feather name="user-plus" size={14} color="#4f4f4f" />
              <Text style={styles.actionButtonText}>Share Profile</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function RecipeCard({ item }: { item: RecipeItem }) {
  return (
    <View style={styles.recipeRow}>
      <View style={styles.recipeMain}>
        <View style={styles.thumbnail}>
          <View style={styles.thumbTriangle} />
          <View style={styles.thumbGear} />
          <View style={styles.thumbSquare} />
        </View>

        <View style={styles.recipeTextBlock}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
          <Text style={styles.recipeMeta}>{item.meta}</Text>
          <Text style={styles.recipeDescription}>{item.description}</Text>
        </View>
      </View>

      <View style={styles.recipeRight}>
        <StarRow rating={item.rating} />
        <Feather name="heart" size={18} color="#4f4a57" style={styles.heartIcon} />
      </View>
    </View>
  );
}

export default function ProfilePage() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 900;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <LeftNav />

        <View style={styles.mainArea}>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <ProfileHeader />

            <View style={styles.tabsRow}>
              <View style={[styles.tabPill, styles.tabPillActive]}>
                <Feather name="check" size={14} color="#465143" />
                <Text style={styles.tabTextActive}>Recipes</Text>
              </View>
              <View style={styles.tabPillInactive}>
                <Text style={styles.tabTextInactive}>Saved</Text>
              </View>
            </View>

            <View style={[styles.listCard, isNarrow && styles.listCardNarrow]}>
              {RECIPES.map((item, idx) => (
                <View key={`${item.title}-${idx}`}>
                  <RecipeCard item={item} />
                  {idx !== RECIPES.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const SIDEBAR_WIDTH = 76;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3ece0',
  },
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f3ece0',
  },
  leftNav: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#9eaf93',
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: 'center',
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  navPlusButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#c5d7bb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  navPlusText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#65745d',
    fontWeight: '400',
  },
  navGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  navItem: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  navItemActive: {
    opacity: 1,
  },
  navCircle: {
    width: 42,
    height: 30,
    borderRadius: 14,
    backgroundColor: '#c5d7bb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#5a6653',
  },
  mainArea: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  topBackRow: {
    height: 34,
    justifyContent: 'center',
    paddingLeft: 4,
  },
  scrollContent: {
    paddingBottom: 26,
  },
  profileHeaderCard: {
    minHeight: 164,
    borderRadius: 22,
    backgroundColor: '#ede6f0',
    overflow: 'hidden',
    marginBottom: 18,
    position: 'relative',
  },
  bannerArtwork: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  bannerShape: {
    position: 'absolute',
    opacity: 0.45,
  },
  bannerShapeTriangle: {
    top: 34,
    right: '48%',
    width: 0,
    height: 0,
    borderLeftWidth: 22,
    borderRightWidth: 22,
    borderBottomWidth: 38,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#b6b0bb',
    borderRadius: 6,
  },
  bannerShapeCog: {
    top: 70,
    right: '50%',
    marginRight: 35,
  },
  bannerShapeSquare: {
    top: 82,
    right: '43%',
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#b6b0bb',
  },
  profileContentRow: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  profileIdentityBlock: {
    maxWidth: 520,
  },
  username: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
    color: '#303030',
    marginBottom: 2,
  },
  bioText: {
    fontSize: 12,
    color: '#6a6a6a',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dad6dd',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#353535',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabPillActive: {
    backgroundColor: '#b7d0a8',
  },
  tabPillInactive: {
    backgroundColor: '#8fa582',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  tabTextActive: {
    color: '#465143',
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextInactive: {
    color: '#2f3b2f',
    fontSize: 12,
    fontWeight: '400',
  },
  listCard: {
    backgroundColor: 'transparent',
    borderRadius: 18,
  },
  listCardNarrow: {
    overflow: 'hidden',
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  recipeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#e9e2f0',
    marginRight: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbTriangle: {
    position: 'absolute',
    top: 8,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#c7c0cd',
    borderRadius: 4,
  },
  thumbGear: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#c7c0cd',
    left: 8,
    bottom: 10,
  },
  thumbSquare: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#c7c0cd',
    right: 10,
    bottom: 10,
  },
  recipeTextBlock: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#313131',
    marginBottom: 2,
  },
  recipeMeta: {
    fontSize: 11,
    color: '#5f5d60',
    marginBottom: 2,
  },
  recipeDescription: {
    fontSize: 11,
    color: '#5f5d60',
  },
  recipeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginLeft: 1,
  },
  heartIcon: {
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128, 120, 130, 0.18)',
  },
});
