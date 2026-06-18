/**
 * maintenance-app.js — Interface maintenance préventive (Phase 3)
 *
 * Tableau de bord, équipements, check-lists, calendrier, historique.
 * Séparation UI / MaintenanceService (logique métier).
 */

const MaintenanceApp = {
  currentTab: "dashboard",
  calendarDate: new Date(),
  defaultsPath: "../../data/maintenance/defaults.json",

  async init(defaultsPath) {
    if (defaultsPath) this.defaultsPath = defaultsPath;
    await MaintenanceService.initDefaults(this.defaultsPath);
    this.bindTabs();
    await this.showTab("dashboard");
  },

  bindTabs() {
    document.querySelectorAll("[data-maint-tab]").forEach((btn) => {
      btn.addEventListener("click", () => this.showTab(btn.dataset.maintTab));
    });
  },

  async showTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll("[data-maint-tab]").forEach((b) => {
      b.classList.toggle("active", b.dataset.maintTab === tab);
      b.setAttribute("aria-selected", b.dataset.maintTab === tab);
    });

    const panel = document.getElementById("maint-panel");
    if (!panel) return;

    switch (tab) {
      case "dashboard": panel.innerHTML = await this.renderDashboard(); this.bindDashboard(); break;
      case "equipments": panel.innerHTML = await this.renderEquipments(); this.bindEquipments(); break;
      case "checklists": panel.innerHTML = await this.renderChecklists(); this.bindChecklists(); break;
      case "calendar": panel.innerHTML = await this.renderCalendar(); this.bindCalendar(); break;
      case "history": panel.innerHTML = await this.renderHistory(); this.bindHistory(); break;
    }
  },

  /* ── Dashboard ─────────────────────────────────────────── */

  async renderDashboard() {
    const stats = await MaintenanceService.getDashboardStats();
    return `
      <div class="kpi-grid">
        <div class="kpi-card"><span class="kpi-value">${stats.totalInterventions}</span><span class="kpi-label">Interventions totales</span></div>
        <div class="kpi-card kpi-danger"><span class="kpi-value">${stats.overdueCount}</span><span class="kpi-label">Équipements en retard</span></div>
        <div class="kpi-card kpi-warning"><span class="kpi-value">${stats.dueSoonCount}</span><span class="kpi-label">Échéances &lt; 7 jours</span></div>
        <div class="kpi-card kpi-success"><span class="kpi-value">${stats.tauxRealisation}%</span><span class="kpi-label">Taux de réalisation</span></div>
      </div>
      <div class="maint-grid-2">
        <section class="card">
          <h3>Équipements en retard</h3>
          ${stats.overdueList.length ? stats.overdueList.map((e) => `
            <div class="alert-item status-overdue">
              <strong>${escapeHtml(e.nom)}</strong>
              <span>Échéance : ${formatDate(e.prochainEntretien)} (${Math.abs(daysUntil(e.prochainEntretien))} j de retard)</span>
            </div>
          `).join("") : "<p class=\"text-muted\">Aucun retard.</p>"}
        </section>
        <section class="card">
          <h3>Échéances proches (7 jours)</h3>
          ${stats.dueSoonList.length ? stats.dueSoonList.map((e) => `
            <div class="alert-item status-soon">
              <strong>${escapeHtml(e.nom)}</strong>
              <span>${formatDate(e.prochainEntretien)} — dans ${daysUntil(e.prochainEntretien)} j</span>
            </div>
          `).join("") : "<p class=\"text-muted\">Aucune échéance imminente.</p>"}
        </section>
      </div>
    `;
  },

  bindDashboard() {},

  /* ── Équipements CRUD ──────────────────────────────────── */

  async renderEquipments() {
    const list = await MaintenanceService.getEquipments();
    return `
      <div class="panel-toolbar">
        <h2>Équipements (${list.length})</h2>
        <button type="button" class="btn btn-primary" id="btn-add-eq">+ Ajouter</button>
      </div>
      <div id="eq-form-area"></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Nom</th><th>Marque / Modèle</th><th>Emplacement</th>
            <th>Prochain entretien</th><th>Statut</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${list.map((e) => `
              <tr>
                <td><strong>${escapeHtml(e.nom)}</strong></td>
                <td>${escapeHtml(e.marque)} ${escapeHtml(e.modele)}</td>
                <td>${escapeHtml(e.emplacement)}</td>
                <td>${formatDate(e.prochainEntretien)}</td>
                <td><span class="badge ${dueStatusClass(e.prochainEntretien)}">${daysUntil(e.prochainEntretien) < 0 ? "Retard" : daysUntil(e.prochainEntretien) <= 7 ? "Bientôt" : "OK"}</span></td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-sm btn-outline btn-edit-eq" data-id="${e.id}">Modifier</button>
                  <button type="button" class="btn btn-sm btn-danger btn-del-eq" data-id="${e.id}">Suppr.</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  renderEqForm(equipment = null) {
    return `
      <form class="card form-card" id="eq-form">
        <h3>${equipment ? "Modifier" : "Nouvel"} équipement</h3>
        <input type="hidden" name="id" value="${equipment?.id || ""}">
        <div class="form-grid">
          <label>Nom *<input name="nom" required value="${escapeHtml(equipment?.nom || "")}"></label>
          <label>Marque<input name="marque" value="${escapeHtml(equipment?.marque || "")}"></label>
          <label>Modèle<input name="modele" value="${escapeHtml(equipment?.modele || "")}"></label>
          <label>Emplacement<input name="emplacement" value="${escapeHtml(equipment?.emplacement || "")}"></label>
          <label>Catégorie
            <select name="categorie">
              ${["electricite","automatisme","mecanique","hydraulique","pneumatique","general"].map((c) =>
                `<option value="${c}" ${equipment?.categorie === c ? "selected" : ""}>${c}</option>`
              ).join("")}
            </select>
          </label>
          <label>Fréquence (jours)<input type="number" name="frequenceJours" min="1" value="${equipment?.frequenceJours || 90}"></label>
          <label>Prochain entretien<input type="date" name="prochainEntretien" value="${equipment?.prochainEntretien || new Date().toISOString().slice(0,10)}"></label>
          <label class="full-width">Notes<textarea name="notes" rows="2">${escapeHtml(equipment?.notes || "")}</textarea></label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Enregistrer</button>
          <button type="button" class="btn btn-secondary" id="btn-cancel-eq">Annuler</button>
        </div>
      </form>
    `;
  },

  bindEquipments() {
    document.getElementById("btn-add-eq")?.addEventListener("click", () => {
      document.getElementById("eq-form-area").innerHTML = this.renderEqForm();
      this.bindEqForm();
    });
    document.querySelectorAll(".btn-edit-eq").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const eq = await MaintenanceService.getEquipment(btn.dataset.id);
        document.getElementById("eq-form-area").innerHTML = this.renderEqForm(eq);
        this.bindEqForm();
      });
    });
    document.querySelectorAll(".btn-del-eq").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (confirm("Supprimer cet équipement et ses check-lists associées ?")) {
          await MaintenanceService.deleteEquipment(btn.dataset.id);
          await this.showTab("equipments");
        }
      });
    });
  },

  bindEqForm() {
    document.getElementById("btn-cancel-eq")?.addEventListener("click", () => {
      document.getElementById("eq-form-area").innerHTML = "";
    });
    document.getElementById("eq-form")?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const data = Object.fromEntries(fd.entries());
      if (data.id) {
        await MaintenanceService.updateEquipment(data.id, data);
      } else {
        await MaintenanceService.createEquipment(data);
      }
      await this.showTab("equipments");
    });
  },

  /* ── Check-lists ───────────────────────────────────────── */

  async renderChecklists() {
    const checklists = await MaintenanceService.getChecklists();
    const equipments = await MaintenanceService.getEquipments();
    const eqMap = Object.fromEntries(equipments.map((e) => [e.id, e.nom]));

    return `
      <div class="panel-toolbar">
        <h2>Check-lists (${checklists.length})</h2>
        <button type="button" class="btn btn-primary" id="btn-add-cl">+ Nouvelle check-list</button>
      </div>
      <div id="cl-form-area"></div>
      ${checklists.map((cl) => {
        const done = cl.items.filter((i) => i.done).length;
        const pct = cl.items.length ? Math.round((done / cl.items.length) * 100) : 0;
        return `
          <div class="card checklist-card">
            <div class="checklist-header">
              <div>
                <h3>${escapeHtml(cl.titre)}</h3>
                <span class="text-muted">${escapeHtml(eqMap[cl.equipmentId] || "Équipement inconnu")}</span>
              </div>
              <span class="badge badge-phase">${pct}% complété</span>
            </div>
            <ul class="checklist-items">
              ${cl.items.map((item) => `
                <li>
                  <label>
                    <input type="checkbox" class="cl-item-toggle" data-cl="${cl.id}" data-item="${item.id}" ${item.done ? "checked" : ""}>
                    <span class="${item.done ? "done" : ""}">${escapeHtml(item.label)}</span>
                  </label>
                </li>
              `).join("")}
            </ul>
            <button type="button" class="btn btn-sm btn-danger btn-del-cl" data-id="${cl.id}">Supprimer</button>
          </div>
        `;
      }).join("")}
    `;
  },

  bindChecklists() {
    document.getElementById("btn-add-cl")?.addEventListener("click", async () => {
      const eqs = await MaintenanceService.getEquipments();
      document.getElementById("cl-form-area").innerHTML = `
        <form class="card form-card" id="cl-form">
          <h3>Nouvelle check-list</h3>
          <label>Équipement<select name="equipmentId" required>
            ${eqs.map((e) => `<option value="${e.id}">${escapeHtml(e.nom)}</option>`).join("")}
          </select></label>
          <label>Titre<input name="titre" required placeholder="Entretien mensuel…"></label>
          <label>Tâches (une par ligne)<textarea name="items" rows="5" required placeholder="Contrôle niveau huile&#10;Graissage roulements"></textarea></label>
          <button type="submit" class="btn btn-primary">Créer</button>
        </form>
      `;
      document.getElementById("cl-form")?.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        const items = fd.get("items").split("\n").map((s) => s.trim()).filter(Boolean);
        await MaintenanceService.createChecklist({
          equipmentId: fd.get("equipmentId"),
          titre: fd.get("titre"),
          items,
        });
        await this.showTab("checklists");
      });
    });

    document.querySelectorAll(".cl-item-toggle").forEach((cb) => {
      cb.addEventListener("change", async () => {
        await MaintenanceService.toggleChecklistItem(cb.dataset.cl, cb.dataset.item);
      });
    });
    document.querySelectorAll(".btn-del-cl").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (confirm("Supprimer cette check-list ?")) {
          await MaintenanceService.deleteChecklist(btn.dataset.id);
          await this.showTab("checklists");
        }
      });
    });
  },

  /* ── Calendrier ────────────────────────────────────────── */

  async renderCalendar() {
    const y = this.calendarDate.getFullYear();
    const m = this.calendarDate.getMonth();
    const events = await MaintenanceService.getCalendarEvents(y, m);
    const monthName = this.calendarDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    const firstDay = new Date(y, m, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    let cells = "";
    for (let i = 0; i < offset; i++) cells += `<div class="cal-cell cal-empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = events.filter((e) => e.date === iso);
      cells += `<div class="cal-cell ${dayEvents.some((e) => e.overdue) ? "cal-overdue" : ""}">
        <span class="cal-day">${d}</span>
        ${dayEvents.map((e) => `<span class="cal-event cal-${e.type}" title="${escapeHtml(e.title)}">${e.type === "echeance" ? "⏰" : "✓"}</span>`).join("")}
      </div>`;
    }

    return `
      <div class="panel-toolbar">
        <button type="button" class="btn btn-outline" id="cal-prev">←</button>
        <h2 style="text-transform:capitalize">${monthName}</h2>
        <button type="button" class="btn btn-outline" id="cal-next">→</button>
      </div>
      <div class="calendar-legend">
        <span>⏰ Échéance</span><span>✓ Intervention</span>
      </div>
      <div class="calendar-grid">
        <div class="cal-head">Lun</div><div class="cal-head">Mar</div><div class="cal-head">Mer</div>
        <div class="cal-head">Jeu</div><div class="cal-head">Ven</div><div class="cal-head">Sam</div><div class="cal-head">Dim</div>
        ${cells}
      </div>
      <section class="card" style="margin-top:1.5rem">
        <h3>Événements du mois</h3>
        ${events.length ? events.map((e) => `
          <div class="alert-item ${e.overdue ? "status-overdue" : ""}">
            <strong>${formatDate(e.date)}</strong> — ${escapeHtml(e.title)}
          </div>
        `).join("") : "<p class=\"text-muted\">Aucun événement ce mois.</p>"}
      </section>
    `;
  },

  bindCalendar() {
    document.getElementById("cal-prev")?.addEventListener("click", async () => {
      this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
      await this.showTab("calendar");
    });
    document.getElementById("cal-next")?.addEventListener("click", async () => {
      this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
      await this.showTab("calendar");
    });
  },

  /* ── Historique ──────────────────────────────────────────── */

  async renderHistory() {
    const interventions = await MaintenanceService.getInterventions();
    const equipments = await MaintenanceService.getEquipments();
    const eqMap = Object.fromEntries(equipments.map((e) => [e.id, e.nom]));

    return `
      <div class="panel-toolbar">
        <h2>Historique interventions (${interventions.length})</h2>
        <button type="button" class="btn btn-primary" id="btn-add-int">+ Nouvelle intervention</button>
      </div>
      <div id="int-form-area"></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Date</th><th>Équipement</th><th>Type</th><th>Description</th><th>Technicien</th><th>Durée</th><th></th>
          </tr></thead>
          <tbody>
            ${interventions.map((i) => `
              <tr>
                <td>${formatDate(i.date)}</td>
                <td>${escapeHtml(eqMap[i.equipmentId] || "—")}</td>
                <td><span class="badge ${i.type === "corrective" ? "badge-soon" : "badge-phase"}">${i.type}</span></td>
                <td>${escapeHtml(i.description)}</td>
                <td>${escapeHtml(i.technicien)}</td>
                <td>${i.dureeMinutes} min</td>
                <td><button type="button" class="btn btn-sm btn-danger btn-del-int" data-id="${i.id}">×</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  bindHistory() {
    document.getElementById("btn-add-int")?.addEventListener("click", async () => {
      const eqs = await MaintenanceService.getEquipments();
      document.getElementById("int-form-area").innerHTML = `
        <form class="card form-card" id="int-form">
          <h3>Nouvelle intervention</h3>
          <div class="form-grid">
            <label>Équipement<select name="equipmentId" required>${eqs.map((e) => `<option value="${e.id}">${escapeHtml(e.nom)}</option>`).join("")}</select></label>
            <label>Date<input type="date" name="date" value="${new Date().toISOString().slice(0,10)}" required></label>
            <label>Type<select name="type"><option value="preventive">Préventive</option><option value="corrective">Corrective</option></select></label>
            <label>Technicien<input name="technicien" value=""></label>
            <label>Durée (min)<input type="number" name="dureeMinutes" min="0" value="60"></label>
            <label class="full-width">Description<textarea name="description" rows="2" required></textarea></label>
          </div>
          <button type="submit" class="btn btn-primary">Enregistrer</button>
        </form>
      `;
      document.getElementById("int-form")?.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        await MaintenanceService.createIntervention(Object.fromEntries(fd.entries()));
        await this.showTab("history");
      });
    });
    document.querySelectorAll(".btn-del-int").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (confirm("Supprimer cette intervention ?")) {
          await MaintenanceService.deleteIntervention(btn.dataset.id);
          await this.showTab("history");
        }
      });
    });
  },
};
