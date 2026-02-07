# ⚡ Configuration Rapide Resend

## 🔑 Clé API à Configurer

```
RESEND_API_KEY=re_Ae5gurSB_ExZtMRjDW5jniSjg2HjpofiK
```

## 🚀 Configuration en 2 Étapes

### Étape 1 : Vercel (2 minutes)

1. [Vercel Dashboard](https://vercel.com/dashboard) → Votre projet
2. **Settings** → **Environment Variables**
3. Ajoutez :
   - Name: `RESEND_API_KEY`
   - Value: `re_Ae5gurSB_ExZtMRjDW5jniSjg2HjpofiK`
   - Environnements: ✅ Production ✅ Preview ✅ Development
4. **Save**
5. **Redéployez** (ou attendez le prochain déploiement)

### Étape 2 : Supabase (2 minutes)

1. [Supabase Dashboard](https://supabase.com/dashboard) → Votre projet
2. **Settings** → **Edge Functions** → **Secrets**
3. Ajoutez :
   - Name: `RESEND_API_KEY`
   - Value: `re_Ae5gurSB_ExZtMRjDW5jniSjg2HjpofiK`
4. **Add Secret**

## ✅ C'est Tout !

Les emails fonctionnent maintenant pour :
- ✅ Envoi d'instructions de soins (`/dashboard/requests`)
- ✅ Notifications de nouvelles demandes de projet
- ✅ Rappels de rendez-vous (via Edge Functions)

## 🧪 Test Rapide

1. Allez sur `/dashboard/requests`
2. Sélectionnez un projet
3. Cliquez sur "Envoyer les soins"
4. Vérifiez que l'email arrive bien

---

**Guide complet** : Voir [CONFIGURE_RESEND.md](./CONFIGURE_RESEND.md)
