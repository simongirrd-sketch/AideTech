/**
 * diagnostic-ui.js — Interface utilisateur des diagnostics
 */

const DiagnosticUI = {
  engine: null,
  tree: null,
  basePath: "",

  /** Initialise l'écran de sélection des diagnostics */
  async initCatalog(containerId, jsonPath) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const catalog = await DiagnosticService.getCatalog(jsonPath);
    container.innerHTML = catalog.map((d) => `
      <a href="diagnostic-run.html?id=${d.id}" class="card diag-card" style="text-decoration:none;">
        <div class="card-icon" aria-hidden="true">${d.icon || "🔧"}</div>
        <h3>${escapeHtml(d.title)}</h3>
        <p>${escapeHtml(d.description)}</p>
        <span class="badge badge-phase">${escapeHtml(d.category)}</span>
        <br><br>
        <span class="card-link">Lancer le diagnostic →</span>
      </a>
    `).join("");
  },

  /** Initialise une session diagnostic */
  async initRun(options) {
    this.basePath = options.basePath || "../../data/diagnostics/";
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
      this.showError("Aucun diagnostic sélectionné.");
      return;
    }

    try {
      this.tree = await DiagnosticService.getTree(id, this.basePath);
      this.engine = new DiagnosticEngine(this.tree);
      this.render(options);
    } catch (e) {
      this.showError(`Impossible de charger le diagnostic : ${e.message}`);
    }
  },

  showError(msg) {
    const el = document.getElementById("diag-content");
    if (el) el.innerHTML = `<div class="card" role="alert"><p>${escapeHtml(msg)}</p></div>`;
  },

  /** Rendu principal */
  render(options) {
    const titleEl = document.getElementById("diag-title");
    const contentEl = document.getElementById("diag-content");
    const historyEl = document.getElementById("diag-history");
    const progressEl = document.getElementById("diag-progress");

    if (titleEl) titleEl.textContent = this.tree.title;
    if (progressEl) {
      progressEl.textContent = this.engine.isComplete()
        ? "Diagnostic terminé"
        : `Étape ${this.engine.history.length + 1}`;
    }

    if (this.engine.isComplete()) {
      contentEl.innerHTML = this.renderResult(this.engine.result);
      this.bindResultActions(options);
    } else {
      contentEl.innerHTML = this.renderQuestion(this.engine.getCurrentNode());
      this.bindQuestionActions();
    }

    if (historyEl) historyEl.innerHTML = this.renderHistory();
  },

  renderQuestion(node) {
    if (!node) return "<p>Erreur : noeud introuvable.</p>";
    const options = node.options.map((opt, i) => `
      <button type="button" class="btn btn-outline diag-option" data-index="${i}">
        ${escapeHtml(opt.label)}
      </button>
    `).join("");

    return `
      <div class="diag-question card">
        <h2 class="diag-question-text">${escapeHtml(node.text)}</h2>
        <div class="diag-options" role="group" aria-label="Réponses possibles">
          ${options}
        </div>
        ${this.engine.history.length > 0 ? `
          <button type="button" class="btn btn-secondary diag-back" id="btn-back" style="margin-top:1rem;">
            ← Retour
          </button>
        ` : ""}
      </div>
    `;
  },

  renderResult(result) {
    const severityClass = `result-${result.severity || "info"}`;
    const list = (items, title) => items.length ? `
      <div class="diag-result-block">
        <h3>${title}</h3>
        <ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
      </div>
    ` : "";

    return `
      <div class="diag-result card ${severityClass}">
        <h2>${escapeHtml(result.text)}</h2>
        ${list(result.causes, "Causes probables")}
        ${list(result.verifications, "Vérifications à effectuer")}
        ${list(result.actions, "Actions correctives")}
        <div class="diag-actions">
          <button type="button" class="btn btn-primary" id="btn-restart">Recommencer</button>
          <button type="button" class="btn btn-outline" id="btn-export-pdf">Exporter PDF</button>
          <button type="button" class="btn btn-secondary" id="btn-save">Enregistrer</button>
        </div>
      </div>
    `;
  },

  renderHistory() {
    if (this.engine.history.length === 0) {
      return "<p class=\"text-muted\">Aucune réponse pour l'instant.</p>";
    }
    return `
      <ol class="diag-history-list">
        ${this.engine.history.map((h) => `
          <li>
            <strong>${escapeHtml(h.question)}</strong>
            <span>→ ${escapeHtml(h.answer)}</span>
          </li>
        `).join("")}
      </ol>
    `;
  },

  bindQuestionActions() {
    document.querySelectorAll(".diag-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.engine.answer(Number(btn.dataset.index));
        this.render({});
      });
    });
    document.getElementById("btn-back")?.addEventListener("click", () => {
      this.engine.goBack();
      this.render({});
    });
  },

  bindResultActions(options) {
    document.getElementById("btn-restart")?.addEventListener("click", () => {
      this.engine.reset();
      this.render({});
    });
    document.getElementById("btn-export-pdf")?.addEventListener("click", () => {
      DiagnosticPDF.export(this.engine.exportState());
    });
    document.getElementById("btn-save")?.addEventListener("click", async () => {
      await DiagnosticService.saveSession(this.engine.exportState());
      alert("Diagnostic enregistré dans l'historique local.");
    });
  },
};

/**
 * diagnostic-pdf.js — Export PDF via impression navigateur (sans dépendance)
 */
const DiagnosticPDF = {
  export(state) {
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) {
      alert("Autorisez les pop-ups pour exporter le PDF.");
      return;
    }

    const historyRows = state.history.map((h, i) => `
      <tr><td>${i + 1}</td><td>${escapeHtml(h.question)}</td><td>${escapeHtml(h.answer)}</td></tr>
    `).join("");

    const result = state.result;
    const section = (title, items) => items?.length ? `
      <h3>${title}</h3><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
    ` : "";

    win.document.write(`<!DOCTYPE html><html lang="fr"><head>
      <meta charset="UTF-8">
      <title>Rapport diagnostic — ${escapeHtml(state.diagnosticTitle)}</title>
      <style>
        body { font-family: Segoe UI, sans-serif; padding: 2rem; color: #1e293b; }
        h1 { color: #1a365d; border-bottom: 3px solid #d97706; padding-bottom: 0.5rem; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { border: 1px solid #cbd5e1; padding: 0.5rem; text-align: left; }
        th { background: #f1f5f9; }
        ul { line-height: 1.8; }
        .meta { color: #64748b; font-size: 0.9rem; }
        @media print { body { padding: 1rem; } }
      </style>
    </head><body>
      <h1>SiteMAINT — Rapport de diagnostic</h1>
      <p class="meta">${escapeHtml(state.diagnosticTitle)} — ${formatDateTime(state.completedAt || new Date().toISOString())}</p>
      <h2>Historique des réponses</h2>
      <table><thead><tr><th>#</th><th>Question</th><th>Réponse</th></tr></thead>
      <tbody>${historyRows}</tbody></table>
      ${result ? `<h2>Conclusion : ${escapeHtml(result.text)}</h2>
        ${section("Causes probables", result.causes)}
        ${section("Vérifications", result.verifications)}
        ${section("Actions correctives", result.actions)}` : ""}
      <p class="meta" style="margin-top:2rem;">Généré par SiteMAINT — Document indicatif, ne remplace pas la procédure constructeur.</p>
    </body></html>`);
    win.document.close();
    win.onload = () => { win.print(); };
  },
};
