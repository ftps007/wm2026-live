# ⚽ WM 2026 Tippspiel

FIFA World Cup 2026 Prediction Game - Tippe auf alle 104 Spiele!

## 🌍 Features

- 📅 Alle 104 WM-Spiele (11. Juni - 19. Juli 2026)
- 🤖 AI-Tipps basierend auf Teamstärke & Form
- 🏆 Ligen-System mit Freunden
- 📊 Echtzeit-Ranglisten
- 🔐 Benutzer-Authentifizierung
- 📱 Mobile-optimiert (PWA)

## 🚀 Schnellstart

### 1. Repository klonen

```bash
git clone https://github.com/DEIN-USERNAME/wm2026-tippspiel.git
cd wm2026-tippspiel
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Umgebungsvariablen einrichten

Kopiere `.env.example` zu `.env.local` und trage deine Supabase-Credentials ein:

```bash
cp .env.example .env.local
```

Bearbeite `.env.local`:
```
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key
```

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Die App läuft auf http://localhost:3000

## 🌐 Deployment auf Vercel

### Option A: Via Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option B: Via GitHub

1. Pushe das Repository zu GitHub
2. Gehe zu [vercel.com](https://vercel.com)
3. "New Project" → GitHub Repo auswählen
4. Environment Variables hinzufügen:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

## 🗄️ Supabase Setup

Falls noch nicht geschehen, führe dieses SQL in Supabase aus:

```sql
-- Siehe supabase-schema.sql für das vollständige Schema
```

## 📊 Punktesystem

| Ergebnis | Punkte |
|----------|--------|
| 🎯 Exaktes Ergebnis | 4 |
| ✨ Richtige Differenz + Tendenz | 3 |
| 👍 Richtige Tendenz | 2 |
| ❌ Falsch | 0 |

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Hosting:** Vercel
- **Styling:** Inline CSS (kein Framework)

## 📝 Lizenz

MIT

---

Erstellt für die FIFA WM 2026 🇺🇸 🇲🇽 🇨🇦
