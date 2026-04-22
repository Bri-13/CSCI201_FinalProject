# Homebite — Project Context
> Paste this file at the start of any AI conversation to restore full project context.

---

## What is this project?
A **web-based cooking social media platform** (like a recipe-sharing TikTok).
Course: CSCI 201 Final Project — Team 10, USC.
Users can browse, share, save, rate, and comment on recipes.
Guests can only view. Logged-in users get full access.
AI (Gemini API) generates dietary alternative versions of recipes.

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Java (REST API) |
| Database | MySQL |
| AI | Gemini API |
| Tools | Eclipse, GitHub, VS Code |

**No React. No frameworks. Plain HTML/CSS/JS files.**

---

## Team & Responsibilities

### Web Frontend (my team)
| Person | Page |
|--------|------|
| **Tianyi Li (me)** | `home.html` — Home page with search, filter, recipe feed |
| Rowena (Kexin) | `login.html` — Login / signup page + branding |
| Brianna | `profile.html` — User profile + saved recipes |
| Alex R.A. | `recipe-create.html` — Recipe creation/editing + AI suggestion page |

### Web Backend (connecting front + back)
Ramsey, Shriya B., Evelyn C., Christopher
Meeting: Tuesdays 8pm

### Backend API owners
| Feature | Person | Notes |
|---------|--------|-------|
| User authentication | Shriya | Login state, session |
| User database | Shriya | User info storage |
| Recipes database | Christopher | All recipe CRUD |
| Modified recipe database | Christopher | User-customized recipes |
| Recipe filtering / searching | Ramsey | Search + filter endpoints |
| Recipe recommendations | Ramsey | Popular recipes algorithm |
| Social (comments + ratings) | Evelyn | Comments, star ratings |
| Social database | Evelyn | Comments/ratings storage |
| AI editor | Shriya | Gemini API, dietary alternatives |

---

## Brand: Homebite
- **Slogan:** "Cook the day gently."
- **Cream:** `#F4EDE4`
- **Warm Orange:** `#D87C5A`
- **Sage Green:** `#7A9E7E`
- **Dark Text:** `#3A3A3A`
- **Fonts:** Playfair Display (headings) + DM Sans (body) — from Google Fonts

---

## My File Structure (Tianyi's files)
```
project/
├── home.html       ← HTML structure (rarely needs editing)
├── style.css       ← All styles (edit for visual changes)
├── home.js         ← All interaction logic (search, filter, save, etc.)
└── data.js         ← All mock data + TODO comments for backend hookup
```

---

## What home.html contains
- **Nav bar:** Logo, Explore, My Recipes, Profile, Upload Recipe button, Avatar
- **Hero section:** Tagline + search bar + filter pills
- **Popular Recipes:** 3-column card grid (top-rated recipes)
- **Recent Recipes feed:** Scrollable list of recipe cards with Save button
- **Sidebar:** AI Suggestions panel + Saved Recipes preview (3 items)

---

## Page Navigation / Routing
This is a **multi-page app** — no React Router, just regular href links.

| Action | Goes to | Owner |
|--------|---------|-------|
| Click recipe card | `recipe-detail.html?id=X` | TBD (team decision) |
| Upload Recipe button | `recipe-create.html` | Alex |
| My Recipes / Profile / Avatar | `profile.html` | Brianna |
| View all saved | `profile.html` | Brianna |
| AI suggestion click | `recipe-detail.html?id=aiX` | TBD |
| Explore / Logo click | Reset home page to default state | Tianyi |

---

## What stays on home.html (no page jump)
- Search → dynamically updates recipe cards in place
- Filter pills → dynamically updates recipe cards in place
- See All (Popular) → expands popular grid in place
- See All (Recent) → expands feed list in place
- Save / Unsave button → toggles saved state in place

---

## Backend API hookup — what needs to change in data.js
When backend is ready, replace mock data in `data.js` with fetch() calls:

| Variable | Replace with | Contact |
|----------|-------------|---------|
| `ALL_RECIPES` | `fetch('/api/recipes')` | Christopher |
| `POPULAR_IDS` | `fetch('/api/recipes/popular')` | Ramsey |
| `AI_SUGGESTIONS` | `fetch('/api/ai/suggestions')` | Shriya |
| `INITIAL_SAVED_IDS` | `fetch('/api/users/me/saved')` | Shriya |

Search and filter in `home.js` also need updating:
- `handleSearch()` → `fetch('/api/recipes/search?q=...')` — Ramsey
- `setFilter()` → `fetch('/api/recipes/filter?category=...')` — Ramsey
- `toggleSave()` → `fetch('/api/users/me/saved', {method:'POST'/'DELETE'})` — Shriya

---

## Expected recipe object shape (agree this with Christopher)
```json
{
  "id": 1,
  "title": "Garlic Risotto",
  "author": "@chefitalia",
  "time": "45 min",
  "difficulty": "Easy",
  "tags": ["italian", "healthy"],
  "displayTags": ["Italian", "Healthy"],
  "imageUrl": "...",
  "rating": 4.8,
  "ratingCount": 120
}
```

---

## Current status
- [x] Home page HTML/CSS/JS written with mock data
- [x] All interactions working (search, filter, save, see all, reset)
- [x] All page navigation links in place
- [ ] Backend APIs not ready yet — all data is mock/placeholder
- [ ] Need to confirm `recipe-detail.html` owner with team
- [ ] Need to confirm exact filenames with Rowena, Brianna, Alex
- [ ] Need to agree recipe JSON shape with Christopher
