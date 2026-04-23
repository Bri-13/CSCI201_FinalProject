import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import LeftNav from '../components/LeftNav';
import {
  ALL_RECIPES,
  RECIPE_DETAILS,
  MOCK_COMMENTS,
  INITIAL_SAVED_IDS,
  Recipe,
  RecipeDetail,
  Comment,
} from '../data';
import { fetchRecipe } from '../api';
import { getUser, subscribe } from '../authStore';

function StarRow({
  rating,
  size = 13,
}: {
  rating: number;
  size?: number;
}) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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

export default function RecipeDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = parseInt(id || '0', 10);
  const { width } = useWindowDimensions();
  const isNarrow = width < 900;

  // Mock fallbacks
  const mockRecipe = useMemo(
    () => ALL_RECIPES.find((r) => r.id === recipeId),
    [recipeId]
  );
  const mockDetail = RECIPE_DETAILS[recipeId];

  // Actual data we'll render. Starts as mock, gets replaced if backend has it.
  const [recipe, setRecipe] = useState<Recipe | undefined>(mockRecipe);
  const [detail, setDetail] = useState<RecipeDetail | undefined>(mockDetail);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchRecipe(recipeId);
      if (cancelled) return;
      if (result) {
        setRecipe(result.recipe);
        // Merge: use backend detail but keep mock description/servings/nutrition
        // if backend didn't supply them (since the schema is missing those columns).
        setDetail({
          ...result.detail,
          description: result.detail.description || mockDetail?.description || '',
          servings:    result.detail.servings    || mockDetail?.servings    || 0,
          nutrition:   mockDetail?.nutrition     || result.detail.nutrition,
        });
      }
      // If backend fails, we keep the mock values we already set.
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [recipeId]);

  const [isSaved, setIsSaved] = useState(INITIAL_SAVED_IDS.includes(recipeId));
  const [commentText, setCommentText] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [comments, setComments] = useState<Comment[]>(
    MOCK_COMMENTS.filter((c) => c.recipeId === recipeId)
  );
  const [user, setLocalUser] = useState(getUser());

  useEffect(() => {
    const unsub = subscribe((u) => setLocalUser(u));
    return unsub;
  }, []);

  // Loading state (brief, while fetchRecipe runs)
  if (loading && !recipe) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.root}>
          <LeftNav active="home" />
          <View style={styles.notFound}>
            <Text style={styles.notFoundText}>Loading...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // not found
  if (!recipe) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.root}>
          <LeftNav active="home" />
          <View style={styles.notFound}>
            <MaterialCommunityIcons name="emoticon-sad-outline" size={40} color="#9A8C82" />
            <Text style={styles.notFoundText}>Recipe not found.</Text>
            <Pressable style={styles.btnBack} onPress={() => router.push('/')}>
              <Text style={styles.btnBackText}>Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const toggleSave = () => {
    setIsSaved((v) => !v);
    // TODO(Shriya): POST/DELETE /api/users/me/saved
  };

  const postComment = () => {
    const text = commentText.trim();
    if (!text) return;
    if (!userRating) {
      Alert.alert('Rating required', 'Please select a star rating.');
      return;
    }
    const newComment: Comment = {
      id: 'new_' + Date.now(),
      recipeId,
      user: user ? `@${user.username}` : '@you',
      avatar: (user?.username[0] || 'Y').toUpperCase(),
      rating: userRating,
      text,
      time: 'Just now',
    };
    setComments((prev) => [newComment, ...prev]);
    setCommentText('');
    setUserRating(0);
    // TODO(Evelyn): POST /api/recipes/${recipeId}/comments
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <LeftNav active="home" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <View style={styles.backBar}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>{'<- Back'}</Text>
            </Pressable>
          </View>

          {/* Hero */}
          <View style={[styles.hero, { backgroundColor: recipe.bgColor }]}>
            <MaterialCommunityIcons
              name={recipe.iconName as any}
              size={96}
              color="rgba(255,255,255,0.9)"
            />
          </View>

          {/* Header */}
          <View style={styles.wrap}>
            <View style={[styles.headerRow, isNarrow && { flexDirection: 'column', gap: 16 }]}>
              <View style={{ flex: 1 }}>
                <View style={styles.tagRow}>
                  {recipe.displayTags.map((t) => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.title}>{recipe.title}</Text>
                <Text style={styles.author}>by {recipe.author}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Feather name="clock" size={11} color="#303030" />
                    <Text style={styles.metaText}>{recipe.time}</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Feather name="bar-chart-2" size={11} color="#303030" />
                    <Text style={styles.metaText}>{recipe.difficulty}</Text>
                  </View>
                  {detail && detail.servings > 0 && (
                    <View style={styles.metaPill}>
                      <Feather name="users" size={11} color="#303030" />
                      <Text style={styles.metaText}>{detail.servings} servings</Text>
                    </View>
                  )}
                </View>

                <View style={styles.ratingRow}>
                  {recipe.rating > 0 ? (
                    <>
                      <StarRow rating={recipe.rating} />
                      <Text style={styles.ratingNum}>{recipe.rating}</Text>
                      <Text style={styles.ratingCount}>
                        · {formatCount(recipe.ratingCount)} ratings
                      </Text>
                      <Text style={styles.commentCount}>
                        {'  '}💬 {formatCount(recipe.commentCount)}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.ratingCount}>No ratings yet — be the first!</Text>
                  )}
                </View>
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  style={[styles.btnHdrSave, isSaved && styles.btnHdrSaveActive]}
                  onPress={toggleSave}
                >
                  <Feather name="heart" size={14} color={isSaved ? '#465143' : '#9A8C82'} />
                  <Text style={[styles.btnHdrSaveText, isSaved && { color: '#465143' }]}>
                    {isSaved ? 'Saved' : 'Save'}
                  </Text>
                </Pressable>
                <Pressable style={styles.btnAi}>
                  <Text style={styles.btnAiText}>Modify with AI</Text>
                </Pressable>
              </View>
            </View>

            {/* Content grid */}
            <View style={[styles.contentGrid, isNarrow && { flexDirection: 'column' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.desc}>
                  {detail ? detail.description : 'Full recipe details coming soon.'}
                </Text>

                {/* Ingredients */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Ingredients</Text>
                  {detail ? (
                    <>
                      {detail.servings > 0 && (
                        <Text style={styles.servings}>Makes {detail.servings} servings</Text>
                      )}
                      <View style={styles.ingredientGrid}>
                        {detail.ingredients.map((ing, i) => (
                          <View key={i} style={styles.ingredientItem}>
                            <View style={styles.ingredientDot} />
                            <Text style={styles.ingredientText}>{ing}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : (
                    <Text style={styles.placeholder}>Ingredients coming soon.</Text>
                  )}
                </View>

                {/* Instructions */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Instructions</Text>
                  {detail ? (
                    detail.instructions.map((step, i) => (
                      <View key={i} style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.placeholder}>Instructions coming soon.</Text>
                  )}
                </View>
              </View>

              {/* Sidebar */}
              {!isNarrow && (
                <View style={styles.sidebar}>
                  {detail?.nutrition && detail.nutrition.calories > 0 && (
                    <View style={styles.sidebarCard}>
                      <Text style={styles.sidebarTitle}>
                        Nutrition <Text style={styles.nutNote}>per serving</Text>
                      </Text>
                      <View style={styles.nutritionGrid}>
                        {[
                          { label: 'Calories', value: String(detail.nutrition.calories), unit: 'kcal' },
                          { label: 'Protein',  value: detail.nutrition.protein, unit: '' },
                          { label: 'Carbs',    value: detail.nutrition.carbs,   unit: '' },
                          { label: 'Fat',      value: detail.nutrition.fat,     unit: '' },
                          { label: 'Fiber',    value: detail.nutrition.fiber,   unit: '' },
                        ].map((n) => (
                          <View key={n.label} style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>
                              {n.value}
                              {n.unit ? (
                                <Text style={styles.nutritionUnit}> {n.unit}</Text>
                              ) : null}
                            </Text>
                            <Text style={styles.nutritionLabel}>{n.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.sidebarCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Text style={styles.sidebarTitle}>Modify with AI</Text>
                      <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                    </View>
                    <Text style={styles.sidebarDesc}>
                      Let AI suggest a healthier, vegan, or allergy-friendly version.
                    </Text>
                    <Pressable style={styles.btnAi}>
                      <Text style={styles.btnAiText}>Try AI Modify {'->'}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Comments */}
            <View style={styles.commentsSection}>
              <Text style={styles.sectionTitle}>
                Comments{' '}
                <View style={styles.commentBadge}>
                  <Text style={styles.commentBadgeText}>{comments.length}</Text>
                </View>
              </Text>

              {/* Add comment form */}
              <View style={styles.commentForm}>
                <View style={styles.commentFormTop}>
                  <View style={styles.commentFormAvatar}>
                    <Text style={styles.commentFormAvatarText}>
                      {user?.username[0]?.toUpperCase() || 'Y'}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.commentTextarea}
                    placeholder="Share your experience with this recipe..."
                    placeholderTextColor="#B5A89E"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    numberOfLines={3}
                  />
                </View>
                <View style={styles.commentFormBottom}>
                  <View style={styles.commentRateWrap}>
                    <Text style={styles.commentRateLabel}>Your rating:</Text>
                    <View style={{ flexDirection: 'row', gap: 3 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Pressable key={n} onPress={() => setUserRating(n)}>
                          <Octicons
                            name={n <= userRating ? 'star-fill' : 'star'}
                            size={22}
                            color={n <= userRating ? '#D68C63' : '#D9CFC8'}
                          />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <Pressable style={styles.btnPost} onPress={postComment}>
                    <Text style={styles.btnPostText}>Post</Text>
                  </Pressable>
                </View>
              </View>

              {/* Comment list */}
              {comments.length === 0 ? (
                <Text style={styles.noComments}>No comments yet — be the first!</Text>
              ) : (
                comments.map((c) => (
                  <View
                    key={c.id}
                    style={[
                      styles.commentCard,
                      c.id.startsWith('new_') && { borderColor: '#9eaf93' },
                    ]}
                  >
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>{c.avatar}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUser}>{c.user}</Text>
                        <StarRow rating={c.rating} size={11} />
                        <Text style={styles.commentTime}>{c.time}</Text>
                      </View>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3ece0' },
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#f3ece0' },
  scrollContent: { paddingBottom: 40 },

  notFound: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
  },
  notFoundText: { fontSize: 16, color: '#9A8C82' },
  btnBack: {
    marginTop: 8,
    backgroundColor: '#9eaf93',
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 18,
  },
  btnBackText: { color: 'white', fontSize: 13, fontWeight: '600' },

  backBar: { paddingHorizontal: 22, paddingTop: 14 },
  backLink: { fontSize: 13, fontWeight: '500', color: '#9A8C82' },

  hero: {
    height: 220, marginTop: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  wrap: { paddingHorizontal: 22, paddingTop: 24 },

  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 28,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '700', color: '#303030', marginBottom: 4 },
  author: { fontSize: 13, color: '#9A8C82', marginBottom: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.5, borderColor: '#E8DDD5',
  },
  metaText: { fontSize: 12, color: '#303030', fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  ratingNum: { fontSize: 13, fontWeight: '500', color: '#303030', marginLeft: 4 },
  ratingCount: { fontSize: 13, color: '#9A8C82' },
  commentCount: { fontSize: 13, color: '#9A8C82' },

  headerActions: { gap: 10 },
  btnHdrSave: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 9,
    backgroundColor: '#ffffff',
    borderRadius: 18, borderWidth: 1.5, borderColor: '#E8DDD5',
  },
  btnHdrSaveActive: { borderColor: '#9eaf93', backgroundColor: '#EBF3EC' },
  btnHdrSaveText: { fontSize: 13, fontWeight: '600', color: '#9A8C82' },
  btnAi: {
    backgroundColor: '#D68C63',
    paddingHorizontal: 20, paddingVertical: 9, borderRadius: 18,
    alignItems: 'center', alignSelf: 'flex-start',
  },
  btnAiText: { color: 'white', fontSize: 13, fontWeight: '600' },

  contentGrid: { flexDirection: 'row', gap: 32, marginBottom: 40 },
  desc: { fontSize: 14, lineHeight: 22, color: '#5f5d60', marginBottom: 24 },

  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 18, fontWeight: '600', color: '#303030',
    marginBottom: 14, paddingBottom: 8,
    borderBottomWidth: 1.5, borderBottomColor: '#E8DDD5',
  },
  servings: { fontSize: 12, color: '#9A8C82', marginBottom: 12 },

  ingredientGrid: { gap: 8 },
  ingredientItem: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: '#E8DDD5',
  },
  ingredientDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#D68C63', marginTop: 6,
  },
  ingredientText: { flex: 1, fontSize: 13, lineHeight: 18, color: '#303030' },

  stepItem: {
    flexDirection: 'row', gap: 14,
    backgroundColor: '#ffffff',
    padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E8DDD5',
    marginBottom: 12,
  },
  stepNumber: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#D68C63',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: { color: 'white', fontSize: 12, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 13, lineHeight: 20, color: '#303030' },
  placeholder: { fontSize: 13, color: '#9A8C82' },

  sidebar: { width: 260, gap: 16 },
  sidebarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E8DDD5',
  },
  sidebarTitle: { fontSize: 15, fontWeight: '600', color: '#303030', marginBottom: 10 },
  sidebarDesc: { fontSize: 12, color: '#5f5d60', lineHeight: 18, marginBottom: 12 },
  nutNote: { fontSize: 10, color: '#9A8C82', fontWeight: '400' },
  aiBadge: {
    backgroundColor: '#9eaf93',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  aiBadgeText: { fontSize: 9, fontWeight: '700', color: 'white', letterSpacing: 1 },

  nutritionGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  nutritionItem: {
    flexBasis: '30%', flexGrow: 1,
    backgroundColor: '#f3ece0',
    paddingVertical: 10, paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  nutritionValue: { fontSize: 16, fontWeight: '700', color: '#303030' },
  nutritionUnit: { fontSize: 9, fontWeight: '500', color: '#9A8C82' },
  nutritionLabel: {
    fontSize: 9, color: '#9A8C82',
    fontWeight: '500', letterSpacing: 0.5,
    textTransform: 'uppercase', marginTop: 2,
  },

  commentsSection: {
    borderTopWidth: 1.5, borderTopColor: '#E8DDD5',
    paddingTop: 28,
  },
  commentBadge: {
    backgroundColor: '#D68C63',
    paddingHorizontal: 7, paddingVertical: 1, borderRadius: 12,
  },
  commentBadgeText: { color: 'white', fontSize: 11, fontWeight: '700' },

  commentForm: {
    backgroundColor: '#ffffff',
    borderRadius: 14, padding: 16, marginBottom: 22,
    borderWidth: 1.5, borderColor: '#E8DDD5',
  },
  commentFormTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  commentFormAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#D68C63',
    alignItems: 'center', justifyContent: 'center',
  },
  commentFormAvatarText: { color: 'white', fontWeight: '600', fontSize: 14 },
  commentTextarea: {
    flex: 1, minHeight: 60,
    backgroundColor: '#f3ece0',
    borderRadius: 10, borderWidth: 1.5, borderColor: '#E8DDD5',
    padding: 10, fontSize: 13, color: '#303030',
    textAlignVertical: 'top',
  },
  commentFormBottom: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
  },
  commentRateWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  commentRateLabel: { fontSize: 12, color: '#9A8C82', fontWeight: '500' },
  btnPost: {
    backgroundColor: '#D68C63',
    paddingHorizontal: 20, paddingVertical: 9, borderRadius: 18,
  },
  btnPostText: { color: 'white', fontSize: 13, fontWeight: '600' },

  commentCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: '#ffffff',
    padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E8DDD5',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#9eaf93',
    alignItems: 'center', justifyContent: 'center',
  },
  commentAvatarText: { color: 'white', fontWeight: '600', fontSize: 14 },
  commentHeader: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6,
  },
  commentUser: { fontSize: 13, fontWeight: '600', color: '#303030' },
  commentTime: { fontSize: 11, color: '#9A8C82', marginLeft: 'auto' },
  commentText: { fontSize: 13, lineHeight: 20, color: '#303030' },
  noComments: { fontSize: 13, color: '#9A8C82', textAlign: 'center', paddingVertical: 28 },

  tag: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#f3ece0',
    borderWidth: 1, borderColor: '#E8DDD5',
  },
  tagText: { fontSize: 10, color: '#303030', fontWeight: '500' },
});
