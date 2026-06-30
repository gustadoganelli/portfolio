// ===================================================================
// auth.js — Fluxo de login/logout (100% local, modo demonstração)
//
// No projeto original havia um modo "live" opcional com backend.
// Nesta versão de portfólio tudo é local: a autenticação compara
// e-mail/senha com a lista fictícia em data.js (USUARIOS).
// Para plugar um backend real, troque doLogin() por uma chamada
// como: fetch('{{API_URL}}/login', { ... }) e popule DB a partir
// da resposta antes de chamar initApp().
// ===================================================================

// Preenche o formulário com um usuário de demonstração.
function fillDemo(email) {
  document.getElementById('inp-email').value = email;
  document.getElementById('inp-pwd').value = 'demo';
}

// Submissão do formulário de login.
function doLogin(ev) {
  ev.preventDefault();
  const email = document.getElementById('inp-email').value.trim();
  const senha = document.getElementById('inp-pwd').value;
  const err = document.getElementById('lerr');

  const u = login(email, senha);
  if (!u) {
    err.classList.add('on');
    return;
  }
  err.classList.remove('on');

  // Popula o "usuário logado" no estado em memória.
  DB.usuario = u;
  initApp();
}

function doLogout() {
  logout();
  DB.usuario = null;
  document.getElementById('app').classList.remove('on');
  document.getElementById('lo').style.display = 'flex';
  document.getElementById('inp-pwd').value = '';
}
