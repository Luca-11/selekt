# Selekt

Curation personnelle de marques mode indépendantes — Next.js + Notion.

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000). Sans Notion configuré, le site utilise les marques en local (`src/lib/brands-fallback.ts`).

## Brancher Notion

### 1. Colonnes requises

Crée ou adapte ta base Notion avec ces colonnes **(noms exacts)** :

| Colonne | Type Notion |
|---------|-------------|
| **Nom** | Titre |
| **URL** | URL |
| **Catégorie** | Texte ou Sélection |
| **Pays** | Texte ou Sélection |
| **Prix** | Sélection → `Accessible`, `Milieu de gamme`, `Premium` |
| **Score** | Texte ou Nombre |
| **Score max** | Texte ou Nombre |
| **Score partiel** | Sélection (`Oui` / `Non`) ou Case à cocher |
| **Description courte** | Texte ou Sélection |
| **Badge 1**, **Badge 2**, **Badge 3** | Sélection ou Texte |
| **Actu / Dernier drop** | Texte |
| **Couleur**, **Accent** | Texte *(optionnel — palette auto sinon)* |
| **Image** | URL *(hero sur les cartes)* |
| **Logo** | URL |
| **Instagram**, **TikTok**, **X / Twitter** | URL |

> Les anciennes valeurs `€`, `€€`, `€€€` restent lues correctement, mais les nouvelles fiches utilisent les libellés texte.

### 2. Intégration Notion

1. [notion.so/my-integrations](https://www.notion.so/my-integrations) → **Nouvelle intégration**
2. Copie le **Internal Integration Secret**
3. Sur ta base : `···` → **Connexions** → ajoute l'intégration
4. Copie l'**ID de la source de données** depuis l'URL Notion

### 3. Variables d'environnement

```bash
cp .env.example .env.local
```

```env
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID=...
ADMIN_PASSWORD=ton-mot-de-passe
```

Optionnel (IA) :

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Redémarre `npm run dev`. Le bandeau « Données locales » disparaît quand Notion répond.

## Admin — ajouter / modifier / supprimer

1. Va sur `/admin`
2. **Liste** : toutes les marques Notion — Modifier ou Supprimer
3. **Nouvelle marque** : colle une URL → Analyser → Publier
4. Republier la **même URL** met aussi à jour une fiche existante

### IA (optionnel)

Sans clé API, le scrap meta fonctionne (titre, description, logo, réseaux partiels).

Avec OpenAI ou Anthropic : enrichissement description + suggestion hero.

Si quota dépassé (429), un message clair s'affiche dans l'admin — le brouillon meta reste utilisable.

## Déploiement Vercel

1. Push le repo sur GitHub
2. [vercel.com/new](https://vercel.com/new) → importe le projet
3. Ajoute les variables d'environnement :
   - `NOTION_TOKEN`
   - `NOTION_DATABASE_ID`
   - `ADMIN_PASSWORD`
   - `OPENAI_API_KEY` *(optionnel)*
   - `AI_PROVIDER=openai` *(optionnel)*
4. **Deploy**

Le site rebuild automatiquement. L'admin est protégé par mot de passe cookie — utilise un `ADMIN_PASSWORD` fort en prod.

## API

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/brands` | GET | Liste des marques |
| `/api/brands` | POST | Publier / mettre à jour par URL (admin) |
| `/api/brands/[id]` | PATCH | Modifier une fiche (admin) |
| `/api/brands/[id]` | DELETE | Supprimer une fiche (admin) |
| `/api/scrape` | POST | Analyser une URL (admin) |
| `/api/admin/session` | GET/POST/DELETE | Session admin |

## Structure

```
src/
  app/           # Pages + icon / apple-icon
  components/    # UI publique + AdminPanel
  lib/scrape/    # Fetch + meta
  lib/ai/        # Enrichissement Claude/OpenAI
  lib/notion.ts  # Lecture + écriture Notion
```
