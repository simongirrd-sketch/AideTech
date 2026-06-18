# SiteMAINT — Plateforme de Maintenance Industrielle

**V1 Complète** — Documentation, diagnostic interactif, maintenance préventive, architecture GMAO.

HTML · CSS · JavaScript Vanilla · GitHub Pages

---

## Fonctionnalités

| Module | Description |
|--------|-------------|
| **Documentation** | 5 catégories, 15 fiches (ABB, Schneider, Siemens, Wago, Lenze, Omron, SEW, Rexroth, Festo, SMC) |
| **Diagnostic** | 6 arbres de décision, historique, export PDF |
| **Maintenance** | Équipements, check-lists, calendrier, KPI, localStorage |
| **GMAO** | Architecture Supabase prête (stub + schéma SQL) |

---

## Démarrage local

```powershell
cd SiteMAINT
python -m http.server 8080
```

Ouvrir **http://localhost:8080**

> Un serveur HTTP est obligatoire (fetch JSON + localStorage).

---

## GitHub Pages

```powershell
git init
git add .
git commit -m "SiteMAINT V1 complète"
git branch -M main
git remote add origin https://github.com/VOTRE-USER/SiteMAINT.git
git push -u origin main
```

Settings → Pages → Branch `main` → `/ (root)`

---

## Architecture

```
UI (HTML + modules JS)
    ↓
Services (machine, diagnostic, maintenance, auth)
    ↓
DataService → LocalStorageProvider (V1) | SupabaseProvider (futur)
```

Voir `ROADMAP.md` pour le détail et les prochaines étapes.

---

## Ajouter un diagnostic

1. `data/diagnostics/nouveau.json`
2. Entrée dans `data/diagnostics/index.json`

## Ajouter une machine

Éditer `data/machines.json` — voir champs existants (pannes, procédures, bonnes pratiques).

## Connexion GMAO démo

Page **Préparation GMAO** : `admin@sitemaint.local` / `demo`

---

## Licence

Projet personnel — formation maintenance industrielle.
