# 🎨 Guide de l'Interface de Réservation Native

## 📋 Fichiers Créés

### Pages
- ✅ `app/book/[artistSlug]/[serviceId]/page.tsx` - Page principale de réservation
- ✅ `app/booking/success/page.tsx` - Page de succès après paiement
- ✅ `app/booking/cancel/page.tsx` - Page d'annulation

### API Routes
- ✅ `app/api/artists/[slug]/route.ts` - Récupérer un artiste par slug
- ✅ `app/api/services/[serviceId]/route.ts` - Récupérer un service par ID

## 🎯 Fonctionnalités

### Étape 1 : Sélection de la Date
- Calendrier avec les 30 prochains jours
- Sélection visuelle de la date
- Validation : date future uniquement

### Étape 2 : Sélection du Créneau
- Liste des créneaux disponibles calculés dynamiquement
- Affichage : heure de début - heure de fin
- Durée affichée pour chaque créneau
- Message si aucun créneau disponible

### Étape 3 : Formulaire Client
- Nom complet (requis)
- Email (requis)
- Téléphone (optionnel)
- Affichage du créneau sélectionné
- Affichage du montant de l'acompte

### Étape 4 : Paiement
- Redirection vers Stripe Checkout
- Paiement de l'acompte uniquement
- Confirmation automatique via webhook

## 🔄 Flux Utilisateur

```
1. Client clique sur "Réserver" depuis la vitrine
   ↓
2. Redirection vers /book/[artistSlug]/[serviceId]
   ↓
3. Sélection de la date
   ↓
4. Affichage des créneaux disponibles (calculés par getAvailableSlots)
   ↓
5. Sélection d'un créneau
   ↓
6. Remplissage du formulaire
   ↓
7. Clic sur "Payer l'acompte"
   ↓
8. Redirection vers Stripe Checkout
   ↓
9. Paiement réussi → /booking/success
   ↓
10. Webhook Stripe confirme le booking
    ↓
11. Booking apparaît dans Dashboard → Calendrier
```

## 🎨 Design

- **Thème** : Dark mode (#0a0a0a)
- **Couleur principale** : Amber-400 (#fbbf24)
- **Animations** : Framer Motion pour les transitions
- **Responsive** : Mobile-first, adaptatif

## 📝 Utilisation

### Depuis la Vitrine

Ajoutez un lien vers la page de réservation :

```tsx
<Link href={`/book/${artistSlug}/${serviceId}`}>
  <button>Réserver ce service</button>
</Link>
```

### Exemple de Route

```
/book/violette/clx1234567890
```

Où :
- `violette` = slug de l'artiste
- `clx1234567890` = ID du service (Service.id)

## ✅ Validation

### Tests à Effectuer

1. **Test du chargement**
   - Vérifier que l'artiste et le service se chargent correctement
   - Vérifier les erreurs 404 si slug/ID invalide

2. **Test des créneaux**
   - Sélectionner une date
   - Vérifier que les créneaux s'affichent
   - Vérifier qu'aucun créneau passé n'est proposé

3. **Test du formulaire**
   - Remplir le formulaire
   - Vérifier la validation
   - Vérifier l'affichage du montant

4. **Test du paiement**
   - Créer une réservation
   - Vérifier la redirection vers Stripe
   - Vérifier que le booking est créé en PENDING_PAYMENT

5. **Test du webhook**
   - Compléter le paiement sur Stripe
   - Vérifier que le booking passe en CONFIRMED
   - Vérifier l'apparition dans le Dashboard

## 🔍 Points d'Attention

1. **Variables d'environnement** :
   - `NEXT_PUBLIC_SITE_URL` : Pour les URLs de retour Stripe

2. **Gestion des erreurs** :
   - Affichage des messages d'erreur via toast
   - Redirection en cas d'erreur fatale

3. **Performance** :
   - Les créneaux sont calculés à la demande
   - Pas de préchargement inutile

## 🎉 Résultat

Interface complète et fonctionnelle pour la réservation native, sans dépendance à Cal.com !
