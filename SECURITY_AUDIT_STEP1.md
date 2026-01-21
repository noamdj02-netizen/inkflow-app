# 🔒 Security Audit - Step 1: Database & RLS Security Audit

## ✅ État Actuel

### RLS Activé
- ✅ Toutes les tables critiques ont RLS activé (`artists`, `customers`, `flashs`, `projects`, `bookings`, `stripe_transactions`, `care_templates`)

### Problèmes Identifiés

#### 🔴 CRITIQUE : Projects Table
- **Problème** : Aucune politique INSERT pour les utilisateurs anonymes
- **Impact** : Le formulaire public utilise actuellement `SUPABASE_SERVICE_ROLE_KEY` pour bypass RLS (fonctionnel mais pas optimal)
- **Risque** : Si quelqu'un essaie d'insérer directement via le client Supabase (anon key), ça échoue silencieusement
- **Solution** : Ajouter une politique INSERT restrictive pour les utilisateurs anonymes (statut='inquiry', validation des champs)

#### 🟡 MOYEN : Customers Table
- **Problème** : Politique actuelle bloque TOUT (`USING (false)`)
- **Impact** : Même le service role ne peut pas créer via RLS (mais bypass fonctionne)
- **Risque** : Pas de protection contre les insertions malveillantes via anon key
- **Solution** : Ajouter une politique INSERT publique avec validation email/name

#### 🟢 FAIBLE : Bookings Table
- **État** : Pas de politique INSERT publique (voulu)
- **Justification** : Les bookings sont créés via Stripe webhooks ou API routes (service role)
- **Action** : Aucune action requise

## 🛡️ Corrections Appliquées

### Migration SQL : `supabase/migration-security-rls-audit.sql`

#### 1. Projects Table
```sql
-- ✅ Anonymous users can INSERT projects (for booking form)
-- BUT with strict constraints:
-- - Must be 'inquiry' status
-- - deposit_paid must be false
-- - Email validation (regex)
-- - Name/description length limits
-- - Required fields validation

-- ❌ Anonymous users CANNOT read projects (prevent enumeration)
-- ❌ Anonymous users CANNOT update projects
```

#### 2. Customers Table
```sql
-- ✅ Anonymous users can INSERT customers
-- BUT with validation:
-- - Email format validation (regex)
-- - Name length limits (2-200 chars)

-- ❌ Anonymous users CANNOT read customers (prevent email enumeration)
-- ❌ Anonymous users CANNOT update customers
```

#### 3. Artists Table
- ✅ Vérifié : Seul l'artiste peut voir/modifier ses données
- ✅ Politique basée sur `auth.uid() = id`

#### 4. Bookings Table
- ✅ Vérifié : Seul l'artiste peut voir/modifier ses bookings
- ✅ Pas de politique INSERT publique (création via API/service role uniquement)

## 📋 Checklist de Vérification

### À Exécuter dans Supabase SQL Editor

1. **Vérifier RLS activé** :
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('artists', 'customers', 'projects', 'bookings');
   ```
   → Toutes les tables doivent avoir `rowsecurity = true`

2. **Vérifier les politiques** :
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('projects', 'customers');
   ```
   → Doit afficher les nouvelles politiques

3. **Test INSERT anonyme (projects)** :
   ```sql
   -- En tant qu'utilisateur anonyme (anon key)
   INSERT INTO public.projects (
     artist_id, client_email, client_name, body_part, size_cm, style, description, statut, deposit_paid
   ) VALUES (
     '00000000-0000-0000-0000-000000000000', 
     'test@example.com', 
     'Test User', 
     'Bras', 
     10, 
     'Fine Line', 
     'This is a test description for a tattoo project', 
     'inquiry', 
     false
   );
   ```
   → Doit réussir

4. **Test SELECT anonyme (projects)** :
   ```sql
   -- En tant qu'utilisateur anonyme (anon key)
   SELECT * FROM public.projects;
   ```
   → Doit retourner vide (pas d'accès en lecture)

5. **Test UPDATE anonyme (projects)** :
   ```sql
   -- En tant qu'utilisateur anonyme (anon key)
   UPDATE public.projects SET statut = 'approved' WHERE id = '...';
   ```
   → Doit échouer (pas d'accès en modification)

## 🚀 Prochaines Étapes

1. **Exécuter la migration** :
   - Aller dans Supabase Dashboard → SQL Editor
   - Copier-coller le contenu de `supabase/migration-security-rls-audit.sql`
   - Exécuter le script

2. **Tester manuellement** :
   - Utiliser le formulaire public de booking
   - Vérifier que la soumission fonctionne
   - Vérifier dans les logs Supabase qu'aucune erreur RLS n'apparaît

3. **Vérifier les logs** :
   - Supabase Dashboard → Logs → Postgres Logs
   - Chercher les erreurs RLS (si présentes)

## ⚠️ Notes Importantes

- **Service Role Key** : L'API route `/api/submit-project-request.ts` utilise toujours `SUPABASE_SERVICE_ROLE_KEY` pour bypass RLS. C'est acceptable car :
  - L'API route valide les inputs
  - L'API route est protégée (pas d'accès direct depuis le frontend)
  - C'est plus sécurisé que d'exposer l'anon key avec des politiques RLS complexes

- **Double Protection** : Même si quelqu'un essaie d'insérer directement via l'anon key, les politiques RLS restrictives empêchent les abus (statut='inquiry', validation des champs).

- **Email Enumeration** : Les politiques empêchent les utilisateurs anonymes de lire les customers/projects, ce qui prévient les attaques d'énumération d'emails.

## ✅ Résultat Attendu

Après cette migration :
- ✅ Les utilisateurs anonymes peuvent créer des projets (via formulaire public)
- ✅ Les utilisateurs anonymes ne peuvent PAS lire les projets existants
- ✅ Les utilisateurs anonymes ne peuvent PAS modifier les projets
- ✅ Les artistes ne peuvent voir/modifier que leurs propres projets
- ✅ Protection contre l'injection SQL (validation des champs)
- ✅ Protection contre l'énumération d'emails

---

**Status** : ✅ Step 1 Complete - Ready for Review

**Next** : Step 2 - Server Action Security & Input Validation (Zod schemas)
