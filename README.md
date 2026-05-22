# 🏐 Volley Péi

Application web premium dédiée au calendrier des tournois de volley à La Réunion (974).

Les organisateurs publient librement leurs événements dans un calendrier public, élégant et fluide. Inspiration visuelle : Shadow.tech — ambiance claire, minimaliste, premium.

---

## ✨ Stack technique

- **Next.js 14** (App Router) + **TypeScript**
- **React 18** + **Tailwind CSS**
- **Supabase** (PostgreSQL + Storage)
- **Framer Motion** (animations)
- **React-Leaflet** + OpenStreetMap (carte)
- **Lucide Icons**

---

## 🚀 Installation

### 1. Cloner et installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Dans le **SQL Editor**, exécuter le contenu de `supabase/schema.sql`
3. Cela crée :
   - Les tables `tournaments`, `sponsors`, `visits`
   - Les triggers `updated_at`
   - Les politiques RLS (lecture publique, insertion publique)
   - Les buckets storage `posters` et `sponsors` avec leurs policies

### 3. Variables d'environnement

Copier le fichier d'exemple et le remplir :

```bash
cp .env.local.example .env.local
```

Remplir avec vos clés Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_PARTNERS_CODE=PARTENAIRES974
NEXT_PUBLIC_ADMIN_PASSWORD=admin974
```

### 4. Lancer le dev

```bash
npm run dev
```

L'app est disponible sur [http://localhost:3000](http://localhost:3000).

---

## 🔑 Codes d'accès

| Zone | Code |
|------|------|
| Page **Partenaires** (vitrine sponsors) | `PARTENAIRES974` |
| Page **Admin** (gestion tournois + sponsors) | `admin974` |

> Les codes sont configurables dans `.env.local`.

---

## 📁 Architecture

```
app/
├── page.tsx              → Calendrier (page d'accueil)
├── tournoi/[id]/         → Fiche détaillée d'un tournoi
├── carte/                → Carte OpenStreetMap des tournois
├── partenaires/          → Vitrine sponsors (protégée)
├── admin/                → Back-office (protégé)
└── layout.tsx

components/
├── layout/               → Header, Footer, SplashScreen, Logo
├── calendar/             → Calendrier, cards, modal jour, stats
├── forms/                → Formulaire de publication
├── map/                  → Carte interactive
├── sponsors/             → Slots et fiche détaillée
├── admin/                → AdminTournaments, AdminSponsors
└── ui/                   → Button, Modal, Input, TypeBadge

lib/
├── supabase.ts           → Client + types
└── utils.ts              → Helpers (dates, classNames…)

supabase/
└── schema.sql            → Schéma complet de la base
```

---

## 🎨 Design system

- **Palette ink** : zinc (gris doux) du 50 au 950
- **Accents Réunion** : bleu `#1E40AF`, jaune `#F59E0B`, rouge `#DC2626`
- **Typographie** : Inter (texte) + Space Grotesk (titres)
- **Ombres premium** : `soft`, `card`, `lift`, `premium`
- **Effets** : glass blur, shimmer, halo lumineux du splash

---

## 📋 Fonctionnalités

### Public

- ✅ Splash screen premium (logo animé)
- ✅ Calendrier mensuel avec pastilles tournois
- ✅ Publication libre via formulaire (avec popup d'avertissement + confirmation)
- ✅ Fiche détaillée par tournoi (affiche, infos, contacts, partage)
- ✅ Section "Prochains tournois"
- ✅ Trackers visites jour/mois + tournois du mois
- ✅ Carte OpenStreetMap avec pins automatiques
- ✅ Responsive mobile-first

### Partenaires (code requis)

- ✅ 1 emplacement Gold (au-dessus du calendrier)
- ✅ 6 emplacements Silver (sous le calendrier)
- ✅ 8 emplacements Bronze (en bas)
- ✅ Fiche sponsor détaillée avec galerie
- ✅ **Côté public, les sponsors n'apparaissent pas tant qu'aucun n'existe**

### Admin (mot de passe requis)

- ✅ Gestion tournois : recherche, édition, suppression, ajout de coordonnées GPS
- ✅ Gestion sponsors : CRUD complet, upload image principale + galerie (jusqu'à 10 photos), catégorisation

---

## 🛠 Production

```bash
npm run build
npm start
```

Déployable directement sur **Vercel** (recommandé) ou tout hébergeur Node.

---

## 🔒 Sécurité

- Page admin et partenaires protégées côté UI via `sessionStorage`
- Politiques RLS Supabase : lecture publique, insertion publique (pour la publication libre)
- Les opérations admin sont conditionnées par la session UI

> Pour un usage production à grande échelle, envisager une **vraie authentification Supabase Auth** + des policies RLS plus strictes sur `update`/`delete`.

---

## 📞 Support

Projet créé pour la communauté volley de La Réunion 🇷🇪
