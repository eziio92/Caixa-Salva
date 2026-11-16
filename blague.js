/* BLAGUE TEMPORÁRIA — vídeo de abertura que parece um bug do app.
   Toque 4 vezes no vídeo e o app abre. Para desfazer: apagar blague.js, blague.mp4 e blague.jpg,
   tirar a linha <script src="blague.js"> do index.html e as entradas "blague" do sw.js (ou restaurar a tag "sauvegarde-avant-blague").
   Os dados do app (localStorage) nunca são tocados aqui. */
(function () {
  var q = location.search;
  if (/[?&]blague=0/.test(q)) return;                              // desliga a blague
  if (navigator.webdriver && !/[?&]blague=1/.test(q)) return;      // testes automáticos não passam por ela
  var TOQUES = 4, toques = 0, aberto = false;

  var st = document.createElement('style');
  st.textContent =
    '#blague{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483647;background:#000;touch-action:manipulation;' +
    '-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;' +
    'overscroll-behavior:none;transition:opacity .25s}' +
    '#blague.fim{opacity:0;pointer-events:none}' +
    '#blague video{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;background:#000;pointer-events:none}';
  document.documentElement.appendChild(st);

  var box = document.createElement('div'); box.id = 'blague';
  var v = document.createElement('video');
  v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
  v.setAttribute('disablepictureinpicture', ''); v.setAttribute('x-webkit-airplay', 'deny');
  v.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
  v.loop = true; v.controls = false; v.preload = 'auto'; v.poster = 'blague.jpg';
  box.appendChild(v);
  document.documentElement.appendChild(box);

  function tocar() { var p; try { p = v.play(); } catch (e) {} if (p && p.catch) p.catch(function () {}); }
  function abrir() {
    if (aberto) return; aberto = true;
    try { v.pause(); v.muted = true; } catch (e) {}
    box.classList.add('fim');
    setTimeout(function () {
      try { v.removeAttribute('src'); v.load(); } catch (e) {}
      if (box.parentNode) box.parentNode.removeChild(box);
      if (st.parentNode) st.parentNode.removeChild(st);
    }, 350);
  }

  // Sem som o iPhone deixa tocar sozinho; com som ele recusa até a primeira batida (que então liga o som).
  v.addEventListener('error', abrir);                              // vídeo indisponível (sem internet etc.): nunca prende o app
  box.addEventListener('pointerup', function (ev) {
    ev.preventDefault();
    if (aberto) return;
    toques++;
    if (v.muted) { try { v.muted = false; } catch (e) {} }
    if (v.paused) tocar();
    if (toques >= TOQUES) abrir();
  });
  box.addEventListener('touchmove', function (ev) { ev.preventDefault(); }, { passive: false });
  box.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
  document.addEventListener('visibilitychange', function () { if (!aberto && !document.hidden) tocar(); });

  v.muted = false; v.src = 'blague.mp4';
  var p; try { p = v.play(); } catch (e) {}
  if (p && p.catch) p.catch(function () { v.muted = true; tocar(); });
})();
