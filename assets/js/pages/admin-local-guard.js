(function(){
  // Ensure admin-local only accessible to admins; otherwise redirect to login
  function getSession(){
    try{ return JSON.parse(sessionStorage.getItem('sitemaint_session')); }catch(e){ return null; }
  }
  document.addEventListener('DOMContentLoaded', async ()=>{
    const session = getSession();
    // render header/footer (navigation.js is included in page)
    if(!session || session.role !== 'admin'){
      // not admin -> redirect to login page
      window.location.href = '/pages/login.html';
      return;
    }
    // else proceed (existing admin-local.js logic will run)
    // nothing else to do here; admin-local.js expects session to be valid
  });
})();
