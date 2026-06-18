/**
 * data-provider.js — Couche d'abstraction stockage (Phase 4)
 *
 * Sépare la logique métier du stockage pour permettre
 * la migration localStorage → Supabase sans modifier l'UI.
 */

/** Clés de stockage localStorage */
const STORAGE_KEYS = {
  EQUIPMENTS: "sitemaint_equipments",
  CHECKLISTS: "sitemaint_checklists",
  INTERVENTIONS: "sitemaint_interventions",
  DIAGNOSTIC_HISTORY: "sitemaint_diagnostic_history",
  USER_SESSION: "sitemaint_user_session",
  SETTINGS: "sitemaint_settings",
  INITIALIZED: "sitemaint_initialized_v1",
};

/**
 * Interface de base pour les providers de données.
 * Toute implémentation (local, Supabase) doit respecter ce contrat.
 */
class BaseDataProvider {
  get name() { return "base"; }

  async get(_key) { throw new Error(`${this.name}: get() non implémenté`); }
  async set(_key, _value) { throw new Error(`${this.name}: set() non implémenté`); }
  async remove(_key) { throw new Error(`${this.name}: remove() non implémenté`); }
  async fetchJson(_path) { throw new Error(`${this.name}: fetchJson() non implémenté`); }
  isOnline() { return true; }
}

/**
 * Provider localStorage — utilisé en Phase 3
 */
class LocalStorageProvider extends BaseDataProvider {
  get name() { return "localStorage"; }

  async get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(`LocalStorageProvider.get(${key}):`, e);
      return null;
    }
  }

  async set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  }

  async remove(key) {
    localStorage.removeItem(key);
    return true;
  }

  async fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status} — ${path}`);
    return response.json();
  }
}

/**
 * Provider Supabase — stub préparé pour Phase 4
 *
 * Quand Supabase sera connecté :
 * 1. Remplacer les méthodes stub par les appels supabase.from(...)
 * 2. Changer DataService.useProvider('supabase')
 */
class SupabaseProvider extends BaseDataProvider {
  constructor() {
    super();
    this.connected = false;
    this.url = null;
    this.anonKey = null;
  }

  get name() { return "supabase"; }

  /**
   * Initialise la connexion Supabase (à implémenter)
   * @param {{ url: string, anonKey: string }} config
   */
  connect(config) {
    this.url = config.url;
    this.anonKey = config.anonKey;
    /* TODO Phase 4: import { createClient } from '@supabase/supabase-js' */
    console.info("[SupabaseProvider] Connexion prévue — non activée en V1");
    this.connected = false;
  }

  async get(key) {
    if (!this.connected) {
      console.warn("[SupabaseProvider] Fallback localStorage pour get:", key);
      return new LocalStorageProvider().get(key);
    }
    /* TODO: return supabase.from(table).select() */
    return null;
  }

  async set(key, value) {
    if (!this.connected) {
      return new LocalStorageProvider().set(key, value);
    }
    /* TODO: return supabase.from(table).upsert(value) */
    return false;
  }

  async remove(key) {
    if (!this.connected) return new LocalStorageProvider().remove(key);
    return false;
  }

  async fetchJson(path) {
    return new LocalStorageProvider().fetchJson(path);
  }

  isOnline() {
    return this.connected;
  }
}

/**
 * Point d'accès unique aux données — pattern Service Locator
 */
const DataService = {
  _provider: new LocalStorageProvider(),

  /** Retourne le provider actif */
  get provider() {
    return this._provider;
  },

  /** Bascule vers un autre provider ('local' | 'supabase') */
  useProvider(type = "local") {
    if (type === "supabase") {
      this._provider = new SupabaseProvider();
    } else {
      this._provider = new LocalStorageProvider();
    }
    return this._provider;
  },

  async get(key) { return this._provider.get(key); },
  async set(key, value) { return this._provider.set(key, value); },
  async remove(key) { return this._provider.remove(key); },
  async fetchJson(path) { return this._provider.fetchJson(path); },
};
