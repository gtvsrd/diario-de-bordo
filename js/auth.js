/**
 * Login do administrador (janela modal)
 */

/** Liga os eventos da janela de login. */
function initAuth() {
  const ok = $('#lok');
  ok.onclick = async () => {
    ok.disabled = true;
    $('#lerr').textContent = '';
    try {
      if (await login($('#u').value.trim(), $('#p').value)) {
        $('#dlg').close();
        $('#p').value = '';
        toast('Bem-vindo, administrador');
        route();
      } else $('#lerr').textContent = 'E-mail ou senha incorretos.';
    } catch (e) {
      $('#lerr').textContent = 'Não foi possível entrar. Tente novamente.';
    }
    ok.disabled = false;
  };
  $('#p').onkeydown = (e) => {
    if (e.key === 'Enter') ok.click();
  };
  $('#lcancel').onclick = () => $('#dlg').close();
}
