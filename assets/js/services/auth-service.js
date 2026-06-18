/**
 * auth-service.js — Authentification (stub Phase 4)
 *
 * Prépare la gestion utilisateurs / rôles pour Supabase Auth.
 * En V1 : session locale simulée pour démonstration.
 */

/** Rôles GMAO prévus */
const USER_ROLES = {
  ADMIN: "admin",
  TECHNICIEN: "technicien",
  SUPERVISEUR: "superviseur",
  LECTURE: "lecture_seule",
};

const AuthService = {
  /** Session courante (null = anonyme) */
  _session: null,

  /** Initialise depuis localStorage */
  async init() {
    this._session = await DataService.get(STORAGE_KEYS.USER_SESSION);
    return this._session;
  },

  /** Utilisateur connecté ? */
  isAuthenticated() {
    return !!this._session?.user;
  },

  /** Retourne l'utilisateur courant */
  getCurrentUser() {
    return this._session?.user ?? null;
  },

  /** Vérifie un rôle */
  hasRole(role) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === USER_ROLES.ADMIN) return true;
    return user.role === role;
  },

  /** Connexion simulée (V1) — remplacée par Supabase Auth en Phase 4 */
  async login(email, password) {
    /* TODO Phase 4: supabase.auth.signInWithPassword({ email, password }) */
    const demoUsers = {
      "admin@sitemaint.local": { id: "u1", email, name: "Administrateur", role: USER_ROLES.ADMIN },
      "tech@sitemaint.local": { id: "u2", email, name: "Technicien Demo", role: USER_ROLES.TECHNICIEN },
    };
    const user = demoUsers[email];
    if (!user || password !== "demo") {
      throw new Error("Identifiants invalides (demo: admin@sitemaint.local / demo)");
    }
    this._session = { user, loginAt: new Date().toISOString() };
    await DataService.set(STORAGE_KEYS.USER_SESSION, this._session);
    return user;
  },

  /** Déconnexion */
  async logout() {
    this._session = null;
    await DataService.remove(STORAGE_KEYS.USER_SESSION);
  },

  /** Inscription — stub Phase 4 */
  async register(_email, _password, _metadata) {
    throw new Error("Inscription disponible après connexion Supabase (Phase 4)");
  },
};
