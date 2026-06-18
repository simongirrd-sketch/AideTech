# SiteMAINT — ROADMAP

**Version actuelle : 2.0.0 — V1 Complète**  
**Dernière mise à jour : 18 juin 2026**

---

## Statut global : V1 EXPLOITABLE

| Phase | Statut | Complétude |
|-------|--------|------------|
| Phase 1 — Bibliothèque technique | ✅ Terminé | 100 % |
| Phase 2 — Diagnostic interactif | ✅ Terminé | 100 % |
| Phase 3 — Maintenance préventive | ✅ Terminé | 100 % |
| Phase 4 — GMAO (Supabase) | 🟡 Architecture prête | 30 % (stub) |

---

## ✅ Phase 1 — Bibliothèque Technique

- [x] 5 catégories : Électricité, Automatisme, Mécanique, Hydraulique, Pneumatique
- [x] 15 fiches machines (ABB, Schneider, Siemens, Wago, Lenze, Omron, SEW, Bosch Rexroth, Festo, SMC)
- [x] Pannes fréquentes, procédures de contrôle, causes, bonnes pratiques
- [x] Recherche en temps réel
- [x] Module réutilisable `doc-category.js`
- [x] Design responsive + accessibilité

---

## ✅ Phase 2 — Diagnostic Interactif

- [x] Moteur générique `DiagnosticEngine` (JSON)
- [x] 6 diagnostics : moteur, variateur, capteur, vérin, pompe, API/PLC
- [x] Historique des réponses (sidebar + localStorage)
- [x] Causes, vérifications, actions correctives
- [x] Bouton recommencer + retour arrière
- [x] Export PDF (impression navigateur)
- [x] Interface responsive

### Ajouter un nouveau diagnostic

1. Créer `data/diagnostics/mon-diagnostic.json` (schéma identique aux existants)
2. Ajouter l'entrée dans `data/diagnostics/index.json`
3. Aucune modification JS requise

---

## ✅ Phase 3 — Maintenance Préventive

- [x] CRUD équipements (create, read, update, delete)
- [x] Check-lists avec cases à cocher
- [x] Historique interventions
- [x] Sauvegarde localStorage
- [x] Calendrier mensuel avec échéances
- [x] Alertes retards / échéances < 7 jours
- [x] Tableau de bord KPI :
  - Nombre d'interventions
  - Équipements en retard
  - Taux de réalisation
- [x] Données exemple `data/maintenance/defaults.json`

---

## 🟡 Phase 4 — GMAO Supabase (à connecter)

### Terminé (architecture)

- [x] `DataService` + `LocalStorageProvider`
- [x] `SupabaseProvider` (stub)
- [x] `AuthService` (login démo local)
- [x] Services métier : Machine, Diagnostic, Maintenance
- [x] Séparation UI / services / stockage
- [x] Page `pages/gmao.html` + schéma PostgreSQL documenté

### Reste à développer

- [ ] Créer projet Supabase
- [ ] Implémenter `SupabaseProvider.connect()` avec `@supabase/supabase-js`
- [ ] Tables PostgreSQL (profiles, equipments, interventions, diagnostic_sessions)
- [ ] Supabase Auth (remplacer login démo)
- [ ] Gestion rôles (RLS policies)
- [ ] Sync multi-utilisateurs
- [ ] Upload PDF documents (Supabase Storage)
- [ ] Tableaux de bord temps réel

---

## Améliorations futures (post-V1)

- [ ] Liens téléchargement PDF réels sur fiches machines
- [ ] Photos équipements (Storage)
- [ ] Recherche globale cross-modules
- [ ] Mode hors-ligne (Service Worker)
- [ ] Export CSV interventions
- [ ] Notifications push échéances
- [ ] i18n (EN/FR)
- [ ] Tests automatisés (Playwright)

---

## Arborescence V1

```
assets/js/
├── core/           utils.js, data-provider.js
├── services/       auth, machine, diagnostic, maintenance
└── modules/        diagnostic-ui, maintenance-app, doc-category

data/
├── machines.json
├── diagnostics/    index + 6 arbres
└── maintenance/    defaults.json
```

---

## Commandes utiles

```powershell
cd SiteMAINT
python -m http.server 8080
# → http://localhost:8080
```

**Note :** `fetch()` et localStorage nécessitent un serveur HTTP (pas `file://`).
