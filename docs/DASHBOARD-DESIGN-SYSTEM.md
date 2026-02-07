# Dashboard INKFLOW — Design System

Palette et hiérarchie visuelle pour un rendu professionnel, moderne et structuré (inspiration Appointy), sans effet « blanc sur blanc ».

## Fonds et surfaces

| Usage | Token Tailwind | Valeur | Classe |
|--------|----------------|--------|--------|
| Fond principal | `dash.bg` | `#f8fafc` | `bg-dash-bg` |
| Cartes, sidebar, modales | `dash.surface` | `#ffffff` | `bg-dash-surface` |
| Bordures | `dash.border` | `#e2e8f0` | `border-dash-border` |

- **Ombres** : `shadow-card` (détachement léger des cartes), `shadow-card-hover` au survol.
- Les cartes utilisent **blanc pur** sur le **fond gris clair** pour créer du contraste.

## Couleur primaire (marque et actions)

| Token | Valeur | Usage |
|--------|--------|--------|
| `dash.primary` | `#6366f1` | Logo « FLOW », boutons principaux (+ Nouveau Flash, Créer), lien/élément actif dans la nav, icônes principales |

Classes : `bg-dash-primary`, `text-dash-primary`, `border-dash-primary`.

## Couleurs secondaires (statuts et indicateurs)

| Rôle | Token | Valeur | Exemple |
|--------|--------|--------|--------|
| Succès / positif | `dash.success` | `#10b981` | Revenus, +%, « En ligne », montants positifs |
| Attention / en attente | `dash.warning` | `#f59e0b` | Demandes en attente, indicateurs « En attente » |
| Erreur / négatif | `dash.error` | `#ef4444` | Erreurs, alertes |
| Neutre / informatif | `dash.info` | `#3b82f6` | RDV à venir, infos neutres |

En UI : fonds pastel (ex. `bg-emerald-100 text-dash-success`) pour les icônes et badges.

## Typographie

| Rôle | Token | Valeur | Classe |
|--------|--------|--------|--------|
| Texte principal | `dash.text` | `#1e293b` | `text-dash-text` |
| Texte secondaire | `dash.text-muted` | `#64748b` | `text-dash-text-muted` |
| Légendes / discret | `dash.text-subtle` | `#94a3b8` | `text-dash-text-subtle` |

Icônes : couleur primaire pour les actions importantes, sinon couleur du texte (principal ou muted).

## Application

- **Layout** : `bg-dash-bg` sur le conteneur principal, `bg-dash-surface` + `border-dash-border` + `shadow-card` sur la sidebar et le header.
- **Widgets** : cartes en `bg-dash-surface` avec `border-dash-border` et `shadow-card`.
- **Bouton principal** : `bg-dash-primary` avec `shadow-card`, hover en `hover:opacity-90`.
- **Boutons secondaires** : `bg-slate-100`, `border-dash-border`, `text-dash-text-muted` → `hover:text-dash-text`.

Les tokens sont définis dans `tailwind.config.cjs` (couleurs `dash.*` et ombres `card` / `card-hover`).
