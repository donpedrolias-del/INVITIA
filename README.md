# Orvia Invitations

Application Next.js pour creer des invitations multilingues avec generation structuree, edition visuelle et publication manuelle.

## Fonctionnalites

- Interface bilingue `FR/EN`
- Generation d'invitations pour `mariage`, `anniversaire`, `bapteme`, `professionnel` et `generique`
- Generation OpenAI via l'API `Responses` avec sortie JSON structuree
- API JSON pour generer, creer, modifier et publier une invitation
- Editeur visuel pour les textes, couleurs et blocs de mise en page
- Page publique partageable via `/invite/:slug`
- Stockage `Supabase` si les variables d'environnement sont configurees
- Fallback memoire local si `Supabase` n'est pas encore branche
- Fallback de generation locale si `OPENAI_API_KEY` n'est pas configuree ou si l'appel OpenAI echoue

## Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_INVITATIONS_TABLE` optionnel, par defaut `invitations`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` optionnel, par defaut `gpt-4.1`

## Table Supabase attendue

La table `invitations` doit accepter les colonnes JSON et texte suivantes :

- `id` text primaire
- `slug` text unique
- `status` text
- `eventType` text
- `language` text
- `title` text
- `hostName` text
- `description` text
- `dateTime` text
- `venue` text
- `dressCode` text
- `contactInfo` text
- `heroImage` text
- `theme` text
- `prompt` text
- `content` jsonb
- `design` jsonb
- `createdAt` text
- `updatedAt` text

## Lancer le projet

```bash
npm install
npm run dev
```

## Generation OpenAI

La route [`/api/invitations/generate`](/Users/francisomekongo/Downloads/ORVIA/Cite%20de%20creation%20invitation%20/src/app/api/invitations/generate/route.ts) utilise l'API `Responses` d'OpenAI avec un schema `zod` pour obtenir :

- `content`
- `design`
- `layoutConfig`

Le serveur renvoie toujours une structure compatible avec le front. Si OpenAI est indisponible, l'application revient automatiquement au generateur local.

## API

- `POST /api/invitations/generate`
- `POST /api/invitations`
- `PATCH /api/invitations/:id`
- `POST /api/invitations/:id/publish`
- `GET /invite/:id-or-slug`

## Verification conseillee

- Generer une invitation mariage en FR
- Generer une invitation anniversaire en EN
- Generer une invitation corporate en FR
- Modifier les couleurs et la visibilite des blocs
- Publier puis ouvrir la page publique
