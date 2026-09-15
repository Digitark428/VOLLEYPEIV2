# VolleyPéi V2

Plateforme communautaire du volley à La Réunion : calendrier, associations vérifiées, inscriptions d’équipes, profils joueurs, fil d’actualité et modération.

## Stack

- Next.js 16, React 19 et TypeScript
- Supabase Auth, PostgreSQL, Row Level Security et Storage
- Tailwind CSS, Framer Motion et React Leaflet
- Vercel pour le déploiement

## Installation locale

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Renseigner dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PARTNERS_CODE=change-me
```

Le mot de passe partenaire protège seulement l’espace partenaire privé. L’administration utilise exclusivement Supabase Auth et la liste d’administrateurs en base — jamais un mot de passe public côté navigateur.

## Commandes utiles

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check
```

Une sauvegarde des données de production peut être créée avec :

```bash
node scripts/backup-production.mjs
```

## Fonctionnement

- Toute personne peut consulter le calendrier, les fiches publiques et l’actualité.
- Un compte avec pseudo, e-mail et mot de passe est requis pour participer, aimer, commenter ou inscrire une équipe.
- Les noms réels d’un joueur restent privés sauf choix explicite du joueur.
- Un mineur doit renseigner son responsable légal et obtenir sa confirmation par lien sécurisé.
- Une association doit transmettre ses informations, puis être approuvée par VolleyPéi avant de créer un tournoi.
- Le compte `kevin@digit-ark.com` devient administrateur après création et confirmation de son compte.
- Les images sont converties en WebP, redimensionnées et débarrassées de leurs métadonnées avant envoi.

## Supabase

Le schéma V2 est versionné dans `supabase/migrations/`. Toute modification de base doit passer par une nouvelle migration. Les tables exposées utilisent RLS et les opérations sensibles sont protégées par l’identité Supabase et les rôles stockés en base.

Les anciens fichiers `supabase/schema.sql` et `supabase/notifications.sql` documentent la V1 ; ils ne doivent pas être rejoués sur la production V2.

## Déploiement

Le dépôt GitHub est relié au projet Vercel. Les branches produisent des aperçus, et la branche principale produit le site public après validation. Les variables Supabase doivent être présentes dans les environnements Preview et Production de Vercel.
