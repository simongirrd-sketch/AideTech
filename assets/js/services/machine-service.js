/**
 * machine-service.js — Service documentation technique
 *
 * Charge les fiches machines depuis JSON (V1).
 * Phase 4 : remplacera fetchJson par requêtes Supabase PostgreSQL.
 */

const MachineService = {
  _cache: null,
  _jsonPath: "data/machines.json",

  /** Définit le chemin JSON relatif à la racine */
  setJsonPath(relativeFromRoot) {
    this._jsonPath = relativeFromRoot;
  },

  /** Charge toutes les machines */
  async getAll() {
    if (this._cache) return this._cache;
    const data = await DataService.fetchJson(this._jsonPath);
    this._cache = data.machines || [];
    return this._cache;
  },

  /** Filtre par catégorie */
  async getByCategory(categoryId) {
    const all = await this.getAll();
    return all.filter((m) => m.categorie === categoryId);
  },

  /** Recherche textuelle */
  async search(query, categoryId = null) {
    let list = await this.getAll();
    if (categoryId) list = list.filter((m) => m.categorie === categoryId);
    if (!query?.trim()) return list;

    const term = normalizeText(query);
    return list.filter((m) => {
      const blob = [
        m.nom, m.marque, m.modele, m.description,
        ...(m.notes || []), ...(m.pannesFrequentes || []),
        ...(m.proceduresControle || []), ...(m.causesPossibles || []),
        ...(m.bonnesPratiques || []),
        ...(m.documents || []).map((d) => d.titre),
      ].join(" ");
      return normalizeText(blob).includes(term);
    });
  },

  /** Invalide le cache (après mise à jour des données) */
  clearCache() {
    this._cache = null;
  },
};
