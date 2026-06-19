// Local admin page logic — stores edits in localStorage and allows export/import
(function(){
  const ADMIN_KEY = 'sitemaint_admin_session';
  const STORAGE_KEY = 'sitemaint_data_machines';

  const cfg = window.SITEMAINT_ADMIN_CONFIG || {};
  const ADMIN_USER = cfg.ADMIN_USER || 'admin';
  const ADMIN_PASS = cfg.ADMIN_PASS || 'admin123';

  const loginForm = document.getElementById('login-form');
  const adminPanel = document.getElementById('admin-panel');
  const loginMsg = document.getElementById('login-msg');
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const loadBtn = document.getElementById('btn-load');
  const exportBtn = document.getElementById('btn-export');
  const importInput = document.getElementById('import-json');
  const docList = document.getElementById('doc-list');
  const editor = document.getElementById('editor');
  const btnNew = document.getElementById('btn-new');
  const btnSave = document.getElementById('btn-save');
  const btnCancel = document.getElementById('btn-cancel');

  let state = { data: null, currentDoc: null };

  function isLoggedIn() {
    return sessionStorage.getItem(ADMIN_KEY) === 'true';
  }

  function setLoggedIn(v){
    if(v) sessionStorage.setItem(ADMIN_KEY,'true');
    else sessionStorage.removeItem(ADMIN_KEY);
  }

  async function fetchDefaultData(){
    try{
      const res = await fetch('/data/machines.json');
      if(!res.ok) throw new Error('Fetch failed');
      const json = await res.json();
      return json;
    }catch(e){
      console.warn('Impossible de charger /data/machines.json', e);
      return { machines: [] };
    }
  }

  async function loadData(forceRemote=false){
    // prefer localStorage unless forceRemote
    if(!forceRemote){
      const saved = localStorage.getItem(STORAGE_KEY);
      if(saved){
        try{ state.data = JSON.parse(saved); renderList(); return; }catch(e){ console.warn('JSON parse error',e); }
      }
    }
    state.data = await fetchDefaultData();
    saveToLocal();
    renderList();
  }

  function saveToLocal(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data, null, 2));
  }

  function renderList(){
    if(!state.data || !state.data.machines) { docList.innerHTML = '<p>Aucun document.</p>'; return; }
    docList.innerHTML = '';
    state.data.machines.forEach(m => {
      const el = document.createElement('div');
      el.className = 'admin-doc-item';
      el.innerHTML = `<strong>${m.nom}</strong> <small>${m.categorie} / ${m.sousCategorie || ''}</small>
        <div class="admin-doc-actions">
          <button data-id="${m.id}" class="btn-edit btn">Éditer</button>
          <button data-id="${m.id}" class="btn-delete btn">Supprimer</button>
        </div>`;
      docList.appendChild(el);
    });
    attachDocButtons();
  }

  function attachDocButtons(){
    docList.querySelectorAll('.btn-edit').forEach(b=>b.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id;
      openEditor(state.data.machines.find(x=>x.id===id));
    }));
    docList.querySelectorAll('.btn-delete').forEach(b=>b.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id;
      if(!confirm('Supprimer ce document ?')) return;
      state.data.machines = state.data.machines.filter(x=>x.id!==id);
      saveToLocal();
      renderList();
    }));
  }

  function openEditor(doc){
    editor.hidden = false;
    state.currentDoc = doc || null;
    document.getElementById('doc-id').value = doc?.id || '';
    document.getElementById('doc-nom').value = doc?.nom || '';
    document.getElementById('doc-marque').value = doc?.marque || '';
    document.getElementById('doc-modele').value = doc?.modele || '';
    document.getElementById('doc-categorie').value = doc?.categorie || '';
    document.getElementById('doc-souscategorie').value = doc?.sousCategorie || '';
    document.getElementById('doc-description').value = doc?.description || '';
  }

  btnNew.addEventListener('click', ()=> openEditor(null));
  btnCancel.addEventListener('click', ()=> { editor.hidden=true; state.currentDoc=null; });
  btnSave.addEventListener('click', ()=>{
    const idField = document.getElementById('doc-id').value.trim();
    const id = idField || 'doc-'+Date.now();
    const doc = {
      id,
      categorie: document.getElementById('doc-categorie').value.trim(),
      sousCategorie: document.getElementById('doc-souscategorie').value.trim(),
      nom: document.getElementById('doc-nom').value.trim(),
      marque: document.getElementById('doc-marque').value.trim(),
      modele: document.getElementById('doc-modele').value.trim(),
      description: document.getElementById('doc-description').value.trim(),
      documents: [], notes: [], proceduresControle: [], causesPossibles: [], bonnesPratiques: [], pannesFrequentes: []
    };
    const existingIdx = state.data.machines.findIndex(x=>x.id===id);
    if(existingIdx>=0) state.data.machines[existingIdx] = doc;
    else state.data.machines.unshift(doc);
    saveToLocal();
    editor.hidden = true;
    renderList();
  });

  btnLogin.addEventListener('click', ()=>{
    const u = document.getElementById('admin-user').value;
    const p = document.getElementById('admin-pass').value;
    if(u === ADMIN_USER && p === ADMIN_PASS){
      setLoggedIn(true);
      loginForm.hidden = true;
      adminPanel.hidden = false;
      loginMsg.textContent = '';
      loadData();
    } else {
      loginMsg.textContent = 'Identifiants incorrects';
    }
  });

  btnLogout.addEventListener('click', ()=>{
    setLoggedIn(false);
    adminPanel.hidden = true;
    loginForm.hidden = false;
  });

  loadBtn.addEventListener('click', ()=> loadData(true));

  exportBtn.addEventListener('click', ()=>{
    const dataStr = JSON.stringify(state.data, null, 2);
    const blob = new Blob([dataStr], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'machines-export.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  importInput.addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const json = JSON.parse(reader.result);
        if(json && json.machines){
          state.data = json;
          saveToLocal();
          renderList();
          alert('Import réussi');
        } else throw new Error('Format invalide');
      }catch(err){
        alert('Erreur import: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // On load : show admin if session active
  document.addEventListener('DOMContentLoaded', ()=>{
    if(isLoggedIn()){
      loginForm.hidden = true;
      adminPanel.hidden = false;
      loadData();
    } else {
      loginForm.hidden = false;
      adminPanel.hidden = true;
    }
  });
})();
