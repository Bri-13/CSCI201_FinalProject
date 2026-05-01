// ============================================================
// recipe-edit.tsx — Create / Edit recipe form
//
// Single page that handles both flows:
//   /recipe-edit          -> create a new recipe
//   /recipe-edit?id=NN    -> edit an existing recipe
//
// Backend wiring lives entirely in api.ts:
//   - createRecipe()  -> already wired
//   - updateRecipe()  -> stub ready (RecipeServlet needs `updateRecipe` action)
//
// Saves fall through to local-only behaviour when the backend is
// unreachable or the update endpoint isn't built yet — same pattern
// used elsewhere in the app (mock fallback).
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  Pressable, TextInput, Alert, useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import LeftNav from '../components/LeftNav';
import { ALL_RECIPES, RECIPE_DETAILS } from '../data';
import { fetchRecipe, createRecipe, updateRecipe } from '../api';
import { getUser, subscribe } from '../authStore';

// Keep these in sync with the home page filters so created recipes
// stay searchable through the same category/difficulty/time pills.
const CATEGORY_OPTIONS = [
  'quick', 'vegan', 'pasta', 'healthy', 'desserts',
  'asian', 'italian', 'breakfast', 'mexican', 'indian',
  'american', 'mediterranean',
];

const DIFFICULTY_OPTIONS: Array<'Easy' | 'Medium' | 'Hard'> = [
  'Easy', 'Medium', 'Hard',
];

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export default function RecipeEditPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? parseInt(id, 10) : null;
  const isEditing = editingId !== null && !Number.isNaN(editingId);

  const { width } = useWindowDimensions();
  const isNarrow = width < 900;

  // ── Form state ────────────────────────────────────────────
  const [title, setTitle]             = useState('');
  const [category, setCategory]       = useState<string>('');
  const [difficulty, setDifficulty]   = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [prepTime, setPrepTime]       = useState('');
  const [cookTime, setCookTime]       = useState('');
  const [photoUrl, setPhotoUrl]       = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);

  const [loading, setLoading]   = useState(isEditing);
  const [saving, setSaving]     = useState(false);
  const [user, setLocalUser]    = useState(getUser());

  useEffect(() => {
    const unsub = subscribe((u) => setLocalUser(u));
    return unsub;
  }, []);

  // ── Load existing recipe in edit mode ─────────────────────
  // Try backend first; fall back to mock data so editing still works
  // when the server isn't running (matches home/recipe-detail pattern).
  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    (async () => {
      const result = await fetchRecipe(editingId!);
      if (cancelled) return;
      if (result) {
        const { raw, detail } = result;
        setTitle(raw.recipe_name || '');
        setCategory((raw.category || '').toLowerCase());
        setDifficulty(
          /hard/i.test(raw.difficulty) ? 'Hard'
          : /med/i.test(raw.difficulty) ? 'Medium'
          : 'Easy'
        );
        setPrepTime(raw.prep_time ? String(raw.prep_time) : '');
        setCookTime(raw.cook_time ? String(raw.cook_time) : '');
        setPhotoUrl(raw.photo_url || '');
        setIngredients(detail.ingredients.length ? detail.ingredients : ['']);
        setInstructions(detail.instructions.length ? detail.instructions : ['']);
      } else {
        // Backend miss — try mock data
        const mock = ALL_RECIPES.find((r) => r.id === editingId);
        const detail = RECIPE_DETAILS[editingId!];
        if (mock) {
          setTitle(mock.title);
          setCategory(mock.tags[0] || '');
          setDifficulty(mock.difficulty);
          setPrepTime(String(mock.timeMin));
          setCookTime('');
          setIngredients(detail?.ingredients?.length ? detail.ingredients : ['']);
          setInstructions(detail?.instructions?.length ? detail.instructions : ['']);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [editingId, isEditing]);

  // ── Dynamic list helpers ──────────────────────────────────
  const updateAt = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    idx: number,
    value: string,
  ) => setter((prev) => prev.map((v, i) => (i === idx ? value : v)));

  const removeAt = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    idx: number,
  ) => setter((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== idx)));

  const addRow = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter((prev) => [...prev, '']);

  // ── Submit ────────────────────────────────────────────────
  const cleanList = (arr: string[]) =>
    arr.map((s) => s.trim()).filter(Boolean);

  const validationError = useMemo(() => {
    if (!title.trim()) return 'Please enter a recipe title.';
    if (cleanList(ingredients).length === 0) return 'Add at least one ingredient.';
    if (cleanList(instructions).length === 0) return 'Add at least one instruction.';
    return null;
  }, [title, ingredients, instructions]);

  const handleSave = async () => {
    if (validationError) {
      Alert.alert('Missing info', validationError);
      return;
    }
    if (!user) {
      Alert.alert('Login required', 'Please log in to save a recipe.');
      return;
    }

    const payload = {
      user_id:      user.user_id,
      recipe_name:  title.trim(),
      ingredients:  cleanList(ingredients).join('\n'),
      instructions: cleanList(instructions).join('\n'),
      prep_time:    parseInt(prepTime, 10) || 0,
      cook_time:    parseInt(cookTime, 10) || 0,
      difficulty,
      category:     category || '',
      photo_url:    photoUrl.trim(),
    };

    setSaving(true);
    try {
      if (isEditing) {
        const ok = await updateRecipe({ recipe_id: editingId!, ...payload });
        if (!ok) {
          // Backend update endpoint isn't live yet — surface this clearly
          // but still let the user back out without losing context.
          Alert.alert(
            'Saved locally',
            'The backend doesn\'t support recipe updates yet. Your changes were not persisted.',
          );
        }
      } else {
        await createRecipe(payload);
      }
      router.replace('/');
    } catch {
      Alert.alert(
        'Could not save',
        'Backend is unreachable. Try again once the server is running.',
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────
  if (loading) {
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

          <View style={styles.wrap}>
            {/* Header */}
            <Text style={styles.title}>
              {isEditing ? 'Edit Recipe' : 'Create Recipe'}
            </Text>
            <Text style={styles.subtitle}>
              {isEditing
                ? 'Update your recipe and re-share it with the community.'
                : 'Share a dish you love. Fill in the details below.'}
            </Text>

            {/* ── BASICS ─────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Basics</Text>
            <View style={styles.card}>
              <Field label="Recipe title">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Garlic Butter Shrimp"
                  placeholderTextColor="#B5A89E"
                  value={title}
                  onChangeText={setTitle}
                />
              </Field>

              <Field label="Photo URL (optional)">
                <TextInput
                  style={styles.input}
                  placeholder="https://..."
                  placeholderTextColor="#B5A89E"
                  value={photoUrl}
                  onChangeText={setPhotoUrl}
                  autoCapitalize="none"
                />
              </Field>

              <Field label="Category">
                <View style={styles.pillRow}>
                  <Pressable
                    style={[styles.pill, !category && styles.pillActive]}
                    onPress={() => setCategory('')}
                  >
                    <Text style={[styles.pillText, !category && styles.pillTextActive]}>
                      None
                    </Text>
                  </Pressable>
                  {CATEGORY_OPTIONS.map((c) => (
                    <Pressable
                      key={c}
                      style={[styles.pill, category === c && styles.pillActive]}
                      onPress={() => setCategory(c)}
                    >
                      <Text style={[styles.pillText, category === c && styles.pillTextActive]}>
                        {cap(c)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>

              <Field label="Difficulty">
                <View style={styles.pillRow}>
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <Pressable
                      key={d}
                      style={[styles.pill, difficulty === d && styles.pillActive]}
                      onPress={() => setDifficulty(d)}
                    >
                      <Text style={[styles.pillText, difficulty === d && styles.pillTextActive]}>
                        {d}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>

              <View style={[styles.row, isNarrow && { flexDirection: 'column', gap: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Field label="Prep time (min)">
                    <TextInput
                      style={styles.input}
                      placeholder="15"
                      placeholderTextColor="#B5A89E"
                      value={prepTime}
                      onChangeText={(t) => setPrepTime(t.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                    />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Cook time (min)">
                    <TextInput
                      style={styles.input}
                      placeholder="20"
                      placeholderTextColor="#B5A89E"
                      value={cookTime}
                      onChangeText={(t) => setCookTime(t.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                    />
                  </Field>
                </View>
              </View>
            </View>

            {/* ── INGREDIENTS ────────────────────────────── */}
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.card}>
              {ingredients.map((ing, i) => (
                <View key={i} style={styles.listRow}>
                  <View style={styles.listDot} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={`Ingredient ${i + 1}`}
                    placeholderTextColor="#B5A89E"
                    value={ing}
                    onChangeText={(t) => updateAt(setIngredients, i, t)}
                  />
                  <Pressable
                    style={styles.iconBtn}
                    onPress={() => removeAt(setIngredients, i)}
                  >
                    <Feather name="x" size={14} color="#9A8C82" />
                  </Pressable>
                </View>
              ))}
              <Pressable style={styles.btnAddRow} onPress={() => addRow(setIngredients)}>
                <Feather name="plus" size={13} color="#465143" />
                <Text style={styles.btnAddRowText}>Add ingredient</Text>
              </Pressable>
            </View>

            {/* ── INSTRUCTIONS ───────────────────────────── */}
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.card}>
              {instructions.map((step, i) => (
                <View key={i} style={styles.listRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.inputMulti, { flex: 1 }]}
                    placeholder={`Step ${i + 1}`}
                    placeholderTextColor="#B5A89E"
                    value={step}
                    onChangeText={(t) => updateAt(setInstructions, i, t)}
                    multiline
                  />
                  <Pressable
                    style={styles.iconBtn}
                    onPress={() => removeAt(setInstructions, i)}
                  >
                    <Feather name="x" size={14} color="#9A8C82" />
                  </Pressable>
                </View>
              ))}
              <Pressable style={styles.btnAddRow} onPress={() => addRow(setInstructions)}>
                <Feather name="plus" size={13} color="#465143" />
                <Text style={styles.btnAddRowText}>Add step</Text>
              </Pressable>
            </View>

            {/* ── ACTIONS ────────────────────────────────── */}
            <View style={styles.actionsRow}>
              <Pressable style={styles.btnCancel} onPress={() => router.back()}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btnSave, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.btnSaveText}>
                  {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create recipe'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Small labelled-field wrapper ─────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3ece0' },
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#f3ece0' },
  scrollContent: { paddingBottom: 60 },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: { fontSize: 14, color: '#9A8C82' },

  backBar: { paddingHorizontal: 22, paddingTop: 14 },
  backLink: { fontSize: 13, fontWeight: '500', color: '#9A8C82' },

  wrap: { paddingHorizontal: 22, paddingTop: 18 },

  title: { fontSize: 30, fontWeight: '700', color: '#303030', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#9A8C82', marginBottom: 24 },

  sectionTitle: {
    fontSize: 16, fontWeight: '600', color: '#303030',
    marginTop: 6, marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1.5, borderBottomColor: '#E8DDD5',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E8DDD5',
    marginBottom: 22,
    gap: 14,
  },

  field: { gap: 6 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, color: '#9A8C82',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f3ece0',
    borderRadius: 10, borderWidth: 1.5, borderColor: '#E8DDD5',
    paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 13, color: '#303030',
  },
  inputMulti: {
    minHeight: 56, paddingTop: 10, textAlignVertical: 'top',
  },

  row: { flexDirection: 'row', gap: 14 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#E8DDD5',
    backgroundColor: '#ffffff',
  },
  pillActive: { backgroundColor: '#9eaf93', borderColor: '#9eaf93' },
  pillText: { fontSize: 12, color: '#5f5d60', fontWeight: '500' },
  pillTextActive: { color: 'white' },

  listRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10,
  },
  listDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#D68C63',
    marginTop: 16,
  },
  stepNumber: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#D68C63',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 6,
  },
  stepNumberText: { color: 'white', fontSize: 12, fontWeight: '700' },
  iconBtn: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f3ece0',
    borderWidth: 1, borderColor: '#E8DDD5',
    marginTop: 4,
  },

  btnAddRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#EBF3EC',
    borderWidth: 1.5, borderColor: '#9eaf93',
  },
  btnAddRowText: { fontSize: 12, fontWeight: '600', color: '#465143' },

  actionsRow: {
    flexDirection: 'row', gap: 10,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  btnCancel: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5, borderColor: '#E8DDD5',
    backgroundColor: '#ffffff',
  },
  btnCancelText: { fontSize: 13, fontWeight: '600', color: '#9A8C82' },
  btnSave: {
    paddingHorizontal: 22, paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#D68C63',
  },
  btnSaveText: { fontSize: 13, fontWeight: '600', color: 'white' },
});
