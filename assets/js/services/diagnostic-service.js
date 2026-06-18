/**
 * diagnostic-service.js — Service diagnostics interactifs
 */

const DiagnosticService = {
  _catalog: null,
  _trees: {},

  /** Charge le catalogue des diagnostics */
  async getCatalog(jsonPath = "data/diagnostics/index.json") {
    if (this._catalog) return this._catalog;
    const data = await DataService.fetchJson(jsonPath);
    this._catalog = data.diagnostics || [];
    return this._catalog;
  },

  /** Charge un arbre de décision complet */
  async getTree(diagnosticId, basePath = "data/diagnostics/") {
    if (this._trees[diagnosticId]) return this._trees[diagnosticId];
    const data = await DataService.fetchJson(`${basePath}${diagnosticId}.json`);
    this._trees[diagnosticId] = data;
    return data;
  },

  /** Sauvegarde une session diagnostic dans l'historique local */
  async saveSession(session) {
    const history = (await DataService.get(STORAGE_KEYS.DIAGNOSTIC_HISTORY)) || [];
    history.unshift({
      id: generateId("diag"),
      ...session,
      savedAt: new Date().toISOString(),
    });
    /* Conserver les 50 dernières sessions */
    await DataService.set(STORAGE_KEYS.DIAGNOSTIC_HISTORY, history.slice(0, 50));
  },

  /** Historique des diagnostics effectués */
  async getHistory() {
    return (await DataService.get(STORAGE_KEYS.DIAGNOSTIC_HISTORY)) || [];
  },
};

/**
 * diagnostic-engine.js — Moteur générique d'arbres de décision
 *
 * Fonctionne avec n'importe quel arbre JSON conforme au schéma :
 * { id, title, startNode, nodes: { [id]: { type, text, options?, causes?, ... } } }
 */
class DiagnosticEngine {
  constructor(tree) {
    this.tree = tree;
    this.reset();
  }

  /** Remet à zéro la session */
  reset() {
    this.currentNodeId = this.tree.startNode;
    this.history = []; /* { nodeId, question, answer, answerLabel } */
    this.completed = false;
    this.result = null;
  }

  /** Noeud courant */
  getCurrentNode() {
    return this.tree.nodes[this.currentNodeId] || null;
  }

  /** Session terminée ? */
  isComplete() {
    return this.completed;
  }

  /** Enregistre une réponse et avance */
  answer(optionIndex) {
    const node = this.getCurrentNode();
    if (!node || node.type !== "question") return false;

    const option = node.options[optionIndex];
    if (!option) return false;

    this.history.push({
      nodeId: this.currentNodeId,
      question: node.text,
      answer: option.label,
      answerLabel: option.label,
    });

    const nextId = option.next;
    const nextNode = this.tree.nodes[nextId];
    if (!nextNode) return false;

    this.currentNodeId = nextId;

    if (nextNode.type === "result") {
      this.completed = true;
      this.result = {
        nodeId: nextId,
        text: nextNode.text,
        causes: nextNode.causes || [],
        verifications: nextNode.verifications || [],
        actions: nextNode.actions || [],
        severity: nextNode.severity || "info",
      };
    }

    return true;
  }

  /** Retour en arrière (une étape) */
  goBack() {
    if (this.history.length === 0) return false;
    const last = this.history.pop();
    this.currentNodeId = last.nodeId;
    this.completed = false;
    this.result = null;
    return true;
  }

  /** Exporte l'état pour PDF / historique */
  exportState() {
    return {
      diagnosticId: this.tree.id,
      diagnosticTitle: this.tree.title,
      history: [...this.history],
      result: this.result ? { ...this.result } : null,
      completedAt: this.completed ? new Date().toISOString() : null,
    };
  }
}
