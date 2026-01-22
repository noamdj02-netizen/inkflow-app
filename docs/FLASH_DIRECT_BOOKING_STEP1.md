# 💳 Flash Direct Booking - Step 1: Database Schema

## ✅ Migration Créée

**`supabase/migration-add-flash-deposit.sql`**

Cette migration ajoute le champ `deposit_amount` (optionnel) à la table `flashs`.

---

## 📋 Changements

### Table `flashs`

**Nouveau champ** :
- `deposit_amount` (INTEGER, nullable) - Montant de l'acompte en centimes

**Logique** :
- Si `deposit_amount` est défini → Utiliser cette valeur
- Si `deposit_amount` est NULL → Calculer depuis `prix * artist.deposit_percentage`

**Exemple** :
- Flash avec `prix = 15000` (150€) et `deposit_amount = NULL`
- Artiste avec `deposit_percentage = 30`
- Acompte calculé = `15000 * 0.30 = 4500` (45€)

---

## 🔧 Types TypeScript

Les types dans `types/supabase.ts` ont été mis à jour pour inclure `deposit_amount` :
- `Row.deposit_amount: number | null`
- `Insert.deposit_amount?: number | null`
- `Update.deposit_amount?: number | null`

---

## 📋 Action Requise

**Exécuter la migration SQL** dans Supabase Dashboard → SQL Editor :

```sql
-- Fichier: supabase/migration-add-flash-deposit.sql
```

Cette migration ajoute le champ `deposit_amount` à la table `flashs`.

---

## 🎯 Prochaine Étape

Une fois la migration SQL exécutée, passez à **Step 2** : Création de l'API route pour créer une session Stripe Checkout pour la réservation d'un flash.
