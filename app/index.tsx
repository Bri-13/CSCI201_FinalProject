import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import LeftNav from '../components/LeftNav';
import {
  ALL_RECIPES,
  POPULAR_IDS,
  SAVED_PREVIEW,
  MODIFIED_PREVIEW,
  INITIAL_SAVED_IDS,
  Recipe,
} from '../data';
import { fetchAllRecipes, searchRecipes } from '../api';
import { getUser, subscribe } from '../authStore';

// ── small reusable bits ──────────────────────────────────────
function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && hasHalf);
        return (
          <Octicons
            key={i}
            name={filled ? 'star-fill' : 'star'}
            size={size}
            color={filled ? '#D68C63' : '#D9CFC8'}
            style={{ marginLeft: 1 }}
          />
        );
      })}
    </View>
  );
}

function formatCount(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
}

const CATEGORY_PILLS = [
  { key: 'all',       label: 'All' },
  { key: 'quick',     label: 'Quick meals' },
  { key: 'vegan',     label: 'Vegan' },
  { key: 'pasta',     label: 'Pasta' },
  { key: 'healthy',   label: 'Healthy' },
  { key: 'desserts',  label: 'Desserts' },
  { key: 'asian',     label: 'Asian' },
  { key: 'italian',   label: 'Italian' },
  { key: 'breakfast', label: 'Breakfast' },
];

const DIFFICULTY_PILLS = [
  { key: 'all',    label: 'All' },
  { key: 'Easy',   label: 'Easy' },
  { key: 'Medium', label: 'Medium' },
  { key: 'Hard',   label: 'Hard' },
];

const TIME_PILLS = [
  { key: 'all',    label: 'Any' },
  { key: 'quick',  label: '<= 20 min' },
  { key: 'medium', label: '<= 40 min' },
  { key: 'long',   label: '40+ min' },
];

// ── HOME PAGE ────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isNarrow = width < 900;

  const [searchText, setSearchText]     = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [category, setCategory]         = useState('all');
  const [difficulty, setDifficulty]     = useState('all');
  const [timeFilter, setTimeFilter]     = useState('all');
  const [savedIds, setSavedIds]         = useState<Set<number>>(
    new Set(INITIAL_SAVED_IDS)
  );
  const [filterOpen, setFilterOpen]     = useState(false);
  const [user, setLocalUser]            = useState(getUser());

  // Recipe data source: starts as mock, replaced with backend data once loaded.
  const [recipes, setRecipes]           = useState<Recipe[]>(ALL_RECIPES);
  const [dataSource, setDataSource]     = useState<'loading' | 'backend' | 'mock'>('loading');

  useEffect(() => {
    const unsub = subscribe((u) => setLocalUser(u));
    return unsub;
  }, []);

  // Load all recipes from backend (used on mount + after clearing search)
  const loadAllRecipes = async () => {
    try {
      const rows = await fetchAllRecipes();
      if (rows.length > 0) {
        setRecipes(rows);
        setDataSource('backend');
      } else {
        setRecipes(ALL_RECIPES);
        setDataSource('mock');
      }
    } catch {
      setRecipes(ALL_RECIPES);
      setDataSource('mock');
    }
  };

  // Try to load recipes from backend on mount. Fall back to mock if it fails
  // or returns an empty list (DB likely not seeded yet).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await loadAllRecipes();
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredRecipes = useMemo(() => {
    let results = recipes;
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tags.some((t) => t.includes(q)) ||
          r.author.toLowerCase().includes(q)
      );
    }
    if (category !== 'all') {
      results = results.filter((r) => r.tags.includes(category));
    }
    if (difficulty !== 'all') {
      results = results.filter((r) => r.difficulty === difficulty);
    }
    if (timeFilter === 'quick')  results = results.filter((r) => r.timeMin <= 20);
    if (timeFilter === 'medium') results = results.filter((r) => r.timeMin <= 40);
    if (timeFilter === 'long')   results = results.filter((r) => r.timeMin > 40);
    return results;
  }, [recipes, activeSearch, category, difficulty, timeFilter]);

  // Split into two columns for masonry-lite layout (RN has no CSS columns).
  const [leftCol, rightCol] = useMemo(() => {
    const left: Recipe[] = [];
    const right: Recipe[] = [];
    let leftH = 0, rightH = 0;
    filteredRecipes.forEach((r) => {
      if (leftH <= rightH) { left.push(r);  leftH  += r.imgHeight + 120; }
      else                 { right.push(r); rightH += r.imgHeight + 120; }
    });
    return [left, right];
  }, [filteredRecipes]);

  const toggleSave = (id: number) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // TODO(Shriya): POST/DELETE /api/users/me/saved
  };

  const openRecipe = (id: number) => {
    router.push({ pathname: '/recipe-detail', params: { id: String(id) } });
  };

  const handleSearch = async () => {
    const q = searchText.trim();
    if (!q) return;
    setActiveSearch(q);
    // Try backend search with all current filters (Ramsey's RecipeSearchService
    // supports query + category + difficulty + prepTime combined).
    try {
      const params: { query?: string; category?: string; difficulty?: string; prepTime?: string } = { query: q };
      if (category !== 'all')   params.category = category;
      if (difficulty !== 'all') params.difficulty = difficulty;
      if (timeFilter === 'quick')  params.prepTime = '20';
      if (timeFilter === 'medium') params.prepTime = '40';
      if (timeFilter === 'long')   params.prepTime = '40+';
      const results = await searchRecipes(params);
      if (results.length > 0) {
        setRecipes(results);
        setDataSource('backend');
      }
    } catch {
      // Backend unavailable — local mock filter will handle it via useMemo
    }
  };

  const clearAll = () => {
    setSearchText('');
    setActiveSearch('');
    setCategory('all');
    setDifficulty('all');
    setTimeFilter('all');
    // Restore the full recipe list (search may have replaced it with a subset)
    loadAllRecipes();
  };

  const hasAnyFilter =
    !!activeSearch || category !== 'all' || difficulty !== 'all' || timeFilter !== 'all';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <LeftNav active="home" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <Text style={styles.brand}>Homebite</Text>
            <View style={styles.topBarRight}>
              {user ? (
                <Pressable style={styles.avatar} onPress={() => router.push('/profile')}>
                  <Text style={styles.avatarText}>
                    {user.username[0]?.toUpperCase() || 'U'}
                  </Text>
                </Pressable>
              ) : (
                <>
                  <Pressable style={styles.btnLogin} onPress={() => router.push('/login')}>
                    <Text style={styles.btnLoginText}>Log in</Text>
                  </Pressable>
                  <Pressable style={styles.btnSignup} onPress={() => router.push('/signup')}>
                    <Text style={styles.btnSignupText}>Sign up</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* HERO */}
          <View style={styles.hero}>
            <Text style={styles.heroSub}>COOK THE DAY GENTLY.</Text>
            <Text style={styles.heroTitle}>What are you cooking today?</Text>

            <View style={styles.searchWrap}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search recipes, ingredients, cuisines..."
                placeholderTextColor="#B5A89E"
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <Pressable style={styles.btnSearch} onPress={handleSearch}>
                <Text style={styles.btnSearchText}>Search</Text>
              </Pressable>
            </View>

            <View style={styles.pillRow}>
              {CATEGORY_PILLS.map((p) => (
                <Pressable
                  key={p.key}
                  style={[styles.pill, category === p.key && styles.pillActive]}
                  onPress={() => {
                    setCategory(p.key);
                    // If user previously searched, restore full list before filtering
                    if (activeSearch) {
                      setActiveSearch('');
                      setSearchText('');
                      loadAllRecipes();
                    }
                  }}
                >
                  <Text style={[styles.pillText, category === p.key && styles.pillTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={[styles.pill, styles.pillMore]}
                onPress={() => setFilterOpen((v) => !v)}
              >
                <Text style={styles.pillMoreText}>
                  {filterOpen ? 'Less' : 'More Filters'}
                </Text>
              </Pressable>
              {hasAnyFilter && <Text style={styles.filterIndicator}>• Filtered</Text>}
            </View>

            {filterOpen && (
              <View style={styles.filterPanel}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>DIFFICULTY</Text>
                  <View style={styles.pillRow}>
                    {DIFFICULTY_PILLS.map((p) => (
                      <Pressable
                        key={p.key}
                        style={[styles.pillSmall, difficulty === p.key && styles.pillActive]}
                        onPress={() => setDifficulty(p.key)}
                      >
                        <Text style={[styles.pillText, difficulty === p.key && styles.pillTextActive]}>
                          {p.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>PREP TIME</Text>
                  <View style={styles.pillRow}>
                    {TIME_PILLS.map((p) => (
                      <Pressable
                        key={p.key}
                        style={[styles.pillSmall, timeFilter === p.key && styles.pillActive]}
                        onPress={() => setTimeFilter(p.key)}
                      >
                        <Text style={[styles.pillText, timeFilter === p.key && styles.pillTextActive]}>
                          {p.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Pressable style={styles.btnClearFilters} onPress={clearAll}>
                  <Text style={styles.btnClearFiltersText}>Clear all filters</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* MAIN GRID */}
          <View style={[styles.mainGrid, isNarrow && styles.mainGridNarrow]}>
            <View style={styles.feedCol}>
              {activeSearch ? (
                <View style={styles.resultBanner}>
                  <Text style={styles.resultText}>
                    Showing results for:{' '}
                    <Text style={styles.resultQuery}>"{activeSearch}"</Text>
                  </Text>
                  <Pressable style={styles.btnClear} onPress={clearAll}>
                    <Text style={styles.btnClearText}>Clear</Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Data source banner — shows whether we're showing real or sample data */}
              {dataSource === 'mock' && (
                <View style={styles.sampleBanner}>
                  <Feather name="info" size={12} color="#9A8C82" />
                  <Text style={styles.sampleBannerText}>
                    Showing sample recipes (backend not connected or database empty)
                  </Text>
                </View>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {dataSource === 'loading'
                    ? 'Loading...'
                    : activeSearch
                    ? `${filteredRecipes.length} result${filteredRecipes.length !== 1 ? 's' : ''} found`
                    : category !== 'all'
                    ? `${CATEGORY_PILLS.find((p) => p.key === category)?.label} Recipes`
                    : 'Recipes'}
                </Text>
              </View>

              {filteredRecipes.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="silverware-fork-knife" size={40} color="#9A8C82" />
                  <Text style={styles.emptyText}>No recipes found. Try a different search!</Text>
                </View>
              ) : (
                <View style={styles.masonryRow}>
                  <View style={styles.masonryCol}>
                    {leftCol.map((r) => (
                      <RecipeCard
                        key={r.id}
                        recipe={r}
                        saved={savedIds.has(r.id)}
                        onOpen={() => openRecipe(r.id)}
                        onToggleSave={() => toggleSave(r.id)}
                      />
                    ))}
                  </View>
                  <View style={styles.masonryCol}>
                    {rightCol.map((r) => (
                      <RecipeCard
                        key={r.id}
                        recipe={r}
                        saved={savedIds.has(r.id)}
                        onOpen={() => openRecipe(r.id)}
                        onToggleSave={() => toggleSave(r.id)}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>

            {!isNarrow && (
              <View style={styles.sidebar}>
                <View style={styles.sidebarCard}>
                  <View style={styles.sidebarTitleRow}>
                    <Text style={styles.sidebarTitle}>Modify with AI</Text>
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  </View>
                  <Text style={styles.sidebarDesc}>
                    Open any recipe and let AI suggest a healthier, vegan, or allergy-friendly version.
                  </Text>
                  <Pressable style={styles.btnAi}>
                    <Text style={styles.btnAiText}>Try AI Modify {'->'}</Text>
                  </Pressable>
                </View>

                <View style={styles.sidebarCard}>
                  <Text style={styles.sidebarTitle}>Saved Recipes</Text>
                  {SAVED_PREVIEW.map((s, i) => (
                    <Pressable
                      key={s.id}
                      style={[
                        styles.savedItem,
                        i === SAVED_PREVIEW.length - 1 && { borderBottomWidth: 0 },
                      ]}
                      onPress={() => openRecipe(s.id)}
                    >
                      <View style={[styles.savedDot, { backgroundColor: s.dotColor }]} />
                      <View>
                        <Text style={styles.savedName}>{s.name}</Text>
                        <Text style={styles.savedAuthor}>by {s.author}</Text>
                      </View>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => router.push('/profile')}>
                    <Text style={styles.seeAll}>View all saved {'->'}</Text>
                  </Pressable>
                </View>

                <View style={styles.sidebarCard}>
                  <View style={styles.sidebarTitleRow}>
                    <Text style={styles.sidebarTitle}>My Modified Recipes</Text>
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  </View>
                  {MODIFIED_PREVIEW.length === 0 ? (
                    <Text style={styles.modifiedEmpty}>No AI-modified recipes yet.</Text>
                  ) : (
                    MODIFIED_PREVIEW.map((m, i) => (
                      <Pressable
                        key={m.id}
                        style={[
                          styles.modifiedItem,
                          i === MODIFIED_PREVIEW.length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <View style={styles.modifiedIcon}>
                          <MaterialCommunityIcons name={m.iconName as any} size={18} color="#465143" />
                        </View>
                        <View>
                          <Text style={styles.modifiedName}>{m.modTitle}</Text>
                          <Text style={styles.modifiedOrigin}>from {m.originalTitle}</Text>
                        </View>
                      </Pressable>
                    ))
                  )}
                  <Pressable onPress={() => router.push('/profile')}>
                    <Text style={styles.seeAll}>View all modified {'->'}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── RECIPE CARD ──────────────────────────────────────────────
function RecipeCard({
  recipe,
  saved,
  onOpen,
  onToggleSave,
}: {
  recipe: Recipe;
  saved: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
}) {
  const isPopular = POPULAR_IDS.includes(recipe.id);
  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={[styles.cardImg, { backgroundColor: recipe.bgColor, height: recipe.imgHeight }]}>
        <MaterialCommunityIcons
          name={recipe.iconName as any}
          size={52}
          color="rgba(255,255,255,0.9)"
        />
      </View>
      <View style={styles.cardBody}>
        {isPopular && (
          <View style={styles.badgePopular}>
            <Text style={styles.badgePopularText}>POPULAR</Text>
          </View>
        )}
        <Text style={styles.cardTitle}>{recipe.title}</Text>
        <View style={styles.cardTags}>
          {recipe.displayTags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
        <View style={styles.cardSocialRow}>
          {recipe.rating > 0 ? (
            <>
              <StarRow rating={recipe.rating} />
              <Text style={styles.cardRatingText}>{recipe.rating}</Text>
              <Text style={styles.cardCommentText}>{'  '}{formatCount(recipe.commentCount)} comments</Text>
            </>
          ) : (
            <Text style={styles.cardCommentText}>No ratings yet</Text>
          )}
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {recipe.author} · {recipe.time}
          </Text>
          <Pressable
            style={[styles.btnSave, saved && styles.btnSaveActive]}
            onPress={(e) => { e.stopPropagation(); onToggleSave(); }}
          >
            <Feather name="heart" size={14} color={saved ? '#465143' : '#9A8C82'} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3ece0' },
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#f3ece0' },
  scrollContent: { paddingBottom: 40 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 4,
  },
  brand: { fontSize: 22, fontWeight: '700', color: '#303030' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#9eaf93',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: 'white', fontWeight: '600', fontSize: 14 },
  btnLogin: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 18, borderWidth: 1.5, borderColor: '#dad6dd',
    backgroundColor: '#ffffff',
  },
  btnLoginText: { fontSize: 13, fontWeight: '600', color: '#303030' },
  btnSignup: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 18, backgroundColor: '#9eaf93',
  },
  btnSignupText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },

  hero: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 4 },
  heroSub: {
    fontSize: 11, fontWeight: '500', letterSpacing: 2.5,
    color: '#9A8C82', marginBottom: 10, textAlign: 'center',
  },
  heroTitle: {
    fontSize: 30, fontWeight: '700', color: '#303030',
    textAlign: 'center', marginBottom: 18,
  },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'center',
    width: '100%', maxWidth: 560,
    backgroundColor: '#ffffff',
    borderRadius: 30, borderWidth: 1.5, borderColor: '#E8DDD5',
    paddingLeft: 18, paddingRight: 6, paddingVertical: 5,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#303030', paddingVertical: 8 },
  btnSearch: {
    backgroundColor: '#9eaf93',
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 9,
  },
  btnSearchText: { color: 'white', fontSize: 13, fontWeight: '600' },

  pillRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 8, marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#E8DDD5',
    backgroundColor: '#ffffff',
  },
  pillSmall: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E8DDD5',
    backgroundColor: '#ffffff',
  },
  pillActive: { backgroundColor: '#9eaf93', borderColor: '#9eaf93' },
  pillText: { fontSize: 12, color: '#5f5d60', fontWeight: '500' },
  pillTextActive: { color: 'white' },
  pillMore: { borderColor: '#303030' },
  pillMoreText: { fontSize: 12, color: '#303030', fontWeight: '600' },
  filterIndicator: {
    fontSize: 11, color: '#D68C63', fontWeight: '600',
    alignSelf: 'center',
  },

  filterPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 14, padding: 16, marginTop: 10,
    borderWidth: 1, borderColor: '#E8DDD5', gap: 12,
  },
  filterGroup: { gap: 8 },
  filterGroupLabel: {
    fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, color: '#9A8C82',
  },
  btnClearFilters: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E8DDD5',
  },
  btnClearFiltersText: { fontSize: 12, color: '#9A8C82', fontWeight: '600' },

  mainGrid: {
    flexDirection: 'row',
    paddingHorizontal: 22, paddingTop: 24, gap: 24,
  },
  mainGridNarrow: { flexDirection: 'column' },

  feedCol: { flex: 1 },
  sidebar: { width: 260, gap: 16 },

  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#E8DDD5',
    marginBottom: 16,
  },
  resultText: { fontSize: 13, color: '#5f5d60' },
  resultQuery: { color: '#D68C63', fontWeight: '600' },
  btnClear: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E8DDD5',
  },
  btnClearText: { fontSize: 11, color: '#9A8C82', fontWeight: '600' },

  sampleBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FAEAE3',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 12,
  },
  sampleBannerText: {
    fontSize: 11, color: '#9A8C82', fontStyle: 'italic',
  },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#303030' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, color: '#9A8C82' },

  masonryRow: { flexDirection: 'row', gap: 12 },
  masonryCol: { flex: 1, gap: 12 },

  card: {
    backgroundColor: '#ffffff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E8DDD5',
    overflow: 'hidden',
  },
  cardImg: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 12 },
  badgePopular: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAEAE3',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, marginBottom: 6,
  },
  badgePopularText: { fontSize: 10, fontWeight: '700', color: '#D68C63' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#303030', marginBottom: 6 },
  cardTags: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f3ece0',
    borderWidth: 1, borderColor: '#E8DDD5',
  },
  tagText: { fontSize: 10, color: '#303030', fontWeight: '500' },
  cardSocialRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8,
  },
  cardRatingText: { fontSize: 11, fontWeight: '500', color: '#5f5d60', marginLeft: 4 },
  cardCommentText: { fontSize: 11, color: '#9A8C82' },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  cardMeta: { flex: 1, fontSize: 11, color: '#9A8C82' },
  btnSave: {
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1.5, borderColor: '#E8DDD5',
  },
  btnSaveActive: { borderColor: '#9eaf93', backgroundColor: '#EBF3EC' },

  sidebarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E8DDD5',
  },
  sidebarTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  sidebarTitle: { fontSize: 15, fontWeight: '600', color: '#303030' },
  aiBadge: {
    backgroundColor: '#9eaf93',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 9, fontWeight: '700', color: '#ffffff', letterSpacing: 1,
  },
  sidebarDesc: { fontSize: 12, color: '#5f5d60', lineHeight: 18, marginBottom: 12 },
  btnAi: {
    alignSelf: 'flex-start',
    backgroundColor: '#9eaf93',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18,
  },
  btnAiText: { color: 'white', fontSize: 12, fontWeight: '600' },

  savedItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: '#E8DDD5',
  },
  savedDot: { width: 8, height: 8, borderRadius: 4 },
  savedName: { fontSize: 13, fontWeight: '500', color: '#303030' },
  savedAuthor: { fontSize: 11, color: '#9A8C82' },

  modifiedItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: '#E8DDD5',
  },
  modifiedIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#f3ece0',
    borderWidth: 1, borderColor: '#E8DDD5',
    alignItems: 'center', justifyContent: 'center',
  },
  modifiedName: { fontSize: 13, fontWeight: '500', color: '#303030' },
  modifiedOrigin: { fontSize: 11, color: '#9A8C82' },
  modifiedEmpty: { fontSize: 12, color: '#9A8C82', textAlign: 'center', paddingVertical: 10 },

  seeAll: { fontSize: 12, color: '#D68C63', fontWeight: '500', marginTop: 10 },

  starRow: { flexDirection: 'row', alignItems: 'center' },
});
