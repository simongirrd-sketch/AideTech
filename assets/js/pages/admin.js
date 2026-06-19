// Admin page logic (basic)
import { createSupabaseClient } from '../services/supabase-provider.js';

const cfg = window.SITEMAINT_CONFIG || {};
const svc = createSupabaseClient(cfg);

const loginForm = document.getElementById('login-form');
const adminPanel = document.getElementById('admin-panel');
const loginMsg = document.getElementById('login-msg');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const docList = document.getElementById('doc-list');
const editor = document.getElementById('editor');
const btnNew = document.getElementById('btn-new');
const btnSave = document.getElementById('btn-save');
const btnCancel = document.getElementById('btn-cancel');

let currentDoc = null;

async function checkAdmin(userId) {
  const { data, error } = await svc.client.from('profiles').select('is_admin').eq('id', userId).single();
  if (error) return false;
  return data?.is_admin === true;
}

async function loadDocuments() {
  docList.innerHTML = 'Chargement...';
  try {
    const docs = await svc.documents.list();
    if (!docs || docs.length === 0) {
      docList.innerHTML = '<p>Aucun document.</p>';
      return;
    }
    docList.innerHTML = '';
    docs.forEach(d => {
      const el = document.createElement('div');
      el.className = 'admin-doc-item';
      el.innerHTML = `<strong>${d.title}</strong> <small>${d.category} / ${d.subcategory || ''}</small>
        <div class="admin-doc-actions">
          <button data-id="${d.id}" class="btn-edit">Éditer</button>
          <button data-id="${d.id}" class="btn-delete">Supprimer</button>
        </div>`;
      docList.appendChild(el);
    });
    attachDocButtons();
  } catch (err) {
    docList.innerHTML = '<p>Erreur lors du chargement.</p>';
    console.error(err);
  }
}

function attachDocButtons() {
  docList.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.id;
    currentDoc = await svc.documents.get(id);
    openEditor(currentDoc);
  }));
  docList.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.id;
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await svc.documents.delete(id);
      loadDocuments();
    } catch (err) {
      alert('Erreur suppression');
      console.error(err);
    }
  }));
}

function openEditor(doc = null) {
  editor.hidden = false;
  document.getElementById('doc-title').value = doc?.title || '';
  document.getElementById('doc-category').value = doc?.category || '';
  document.getElementById('doc-subcategory').value = doc?.subcategory || '';
  document.getElementById('doc-content').value = JSON.stringify(doc?.content || {}, null, 2);
}

btnNew.addEventListener('click', () => {
  currentDoc = null;
  openEditor();
});

btnCancel.addEventListener('click', () => {
  editor.hidden = true;
});

btnSave.addEventListener('click', async () => {
  const title = document.getElementById('doc-title').value.trim();
  const category = document.getElementById('doc-category').value.trim();
  const subcategory = document.getElementById('doc-subcategory').value.trim();
  let content;
  try {
    content = JSON.parse(document.getElementById('doc-content').value || '{}');
  } catch (e) {
    alert('Contenu JSON invalide');
    return;
  }
  const payload = {
    id: currentDoc?.id,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
    category,
    subcategory,
    content,
  };
  try {
    await svc.documents.upsert(payload);
    editor.hidden = true;
    loadDocuments();
  } catch (err) {
    alert('Erreur sauvegarde');
    console.error(err);
  }
});

btnLogin.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  loginMsg.textContent = 'Connexion...';
  try {
    const { error } = await svc.auth.signIn(email, password);
    if (error) {
      loginMsg.textContent = error.message;
      return;
    }
    const userResp = await svc.auth.getUser();
    const user = userResp.data.user;
    const isAdmin = await checkAdmin(user.id);
    if (!isAdmin) {
      loginMsg.textContent = 'Accès refusé : non administrateur';
      await svc.auth.signOut();
      return;
    }
    // success
    loginForm.hidden = true;
    adminPanel.hidden = false;
    loginMsg.textContent = '';
    loadDocuments();
  } catch (err) {
    console.error(err);
    loginMsg.textContent = 'Erreur de connexion';
  }
});

btnLogout.addEventListener('click', async () => {
  await svc.auth.signOut();
  adminPanel.hidden = true;
  loginForm.hidden = false;
});

// on load, hide admin panel
adminPanel.hidden = true;

// export for tests (optional)
export default {};
