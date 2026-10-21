/* =========================================================
   comodidad_web.js — [Nuevo] PEQUEÑAS COMODIDADES PARA LA WEB

   Envuelve el código de la página sin tocarlo. Para quitarlo,
   basta con borrar su línea <script src="comodidad_web.js"> del HTML.
   Cada apartado se puede apagar por separado en AJUSTES.

   1) ATRÁS: el botón «atrás» del navegador (o el gesto de deslizar
      en el móvil) cierra lo último que se abrió (dibujo ampliado,
      ficha de novela, muestra, aclaraciones, «Sobre mí», los rombos…)
      en vez de salir de la página.
   2) ESC: cierra lo último que se abrió (antes solo cerraba el dibujo
      ampliado).
   3) IDIOMA: recuerda la bandera elegida para la próxima visita.
   4) MUESTRA: recuerda por dónde ibas leyendo cada muestra y, al
      volver a abrirla, sigue desde ahí.
   5) TÁCTIL: en móviles y tabletas (donde no se puede «pasar el
      ratón por encima») las portadas no se ven apagadas.
   ========================================================= */
(function(){
  const AJUSTES = { atras: true, esc: true, idioma: true, muestra: true, tactil: true };

  const $ = id => document.getElementById(id);
  const tiene = (id, clase) => { const e = $(id); return !!e && e.classList.contains(clase); };
  const visible = id => { const e = $(id); return !!e && e.style.display !== 'none' && e.offsetParent !== null; };
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch(e){} };
  const leer = k => { try { return localStorage.getItem(k); } catch(e){ return null; } };

  /* ---------- capas que se pueden cerrar, de la de más arriba a la de más abajo ---------- */
  const CAPAS = [
    { abierta: () => tiene('illus-viewer', 'open'),                cerrar: () => closeIllusViewer() },
    { abierta: () => tiene('illus-overlay', 'open'),               cerrar: () => closeIllusModal() },
    { abierta: () => tiene('collab-modal-overlay', 'open'),        cerrar: () => closeCollabModal() },
    { abierta: () => { const e = $('logo-modal-overlay'); return !!e && e.style.display === 'flex'; }, cerrar: () => closeLogoModal() },
    { abierta: () => tiene('aclaraciones-overlay', 'open') && visible('aclaraciones-detail'), cerrar: () => closeAclaracion() },
    { abierta: () => tiene('aclaraciones-overlay', 'open'),        cerrar: () => closeAclaracionesModal() },
    { abierta: () => tiene('modal-overlay', 'open') && tiene('modal-sample-view', 'active'), cerrar: () => closeSampleView() },
    { abierta: () => tiene('modal-overlay', 'open'),               cerrar: () => closeModal() },
    { abierta: () => tiene('sidebar', 'open'),                     cerrar: () => closeSidebar(), menu: true },
    { abierta: () => typeof vistaExclusivaActual !== 'undefined' && !!vistaExclusivaActual, cerrar: () => goTo('novelas'), pagina: true },
    { abierta: () => { const r = $('rombos-wrapper'); return !!r && r.style.display !== 'none'; }, cerrar: () => goTo('novelas'), pagina: true },
  ];
  const cuantas = () => CAPAS.filter(c => !c.menu && c.abierta()).length;
  const cerrarLaDeArriba = soloVentanas => {
    const c = CAPAS.find(c => c.abierta() && !(soloVentanas && c.pagina));
    if(!c) return false;
    c.cerrar(); return true;
  };

  /* ---------- 1) el botón «atrás» ---------- */
  if(AJUSTES.atras && window.history && history.pushState){
    let pos = 0;
    history.replaceState({ ecPos: 0 }, '');
    const ABREN = ['mostrarRombos', 'mostrarVistaExclusiva', 'openModal', 'openSampleView', 'openAclaracionesModal',
                   'openAclaracion', 'openIllusModal', 'openIllusViewer', 'openIllusViewerCustom', 'openCollabModal',
                   'openCollabGallery', 'openLogoModal'];
    ABREN.forEach(nombre => {
      const original = window[nombre];
      if(typeof original !== 'function') return;
      window[nombre] = function(){
        const antes = cuantas();
        const r = original.apply(this, arguments);
        if(cuantas() > antes){ pos++; history.pushState({ ecPos: pos }, ''); }
        return r;
      };
    });
    window.addEventListener('popstate', e => {
      const nueva = (e.state && e.state.ecPos) || 0;
      const haciaAtras = nueva < pos;
      pos = nueva;
      if(!haciaAtras) return;                       // «adelante»: no se reabre nada
      if(!cerrarLaDeArriba(false) && nueva > 0) history.back();   // ya estaba cerrado con la X: un paso más
    });
  }

  /* ---------- 2) Esc ---------- */
  if(AJUSTES.esc){
    window.addEventListener('keydown', e => {
      if(e.key !== 'Escape') return;
      if(cerrarLaDeArriba(true)){ e.stopPropagation(); e.preventDefault(); }
    }, true);
  }

  /* ---------- 3) recordar el idioma ---------- */
  if(AJUSTES.idioma){
    ['es', 'en', 'ja'].forEach(l => { const b = $('flag-' + l); if(b) b.addEventListener('click', () => guardar('ec-idioma', l)); });
    document.addEventListener('DOMContentLoaded', () => {       // va después del arranque de la página
      const l = leer('ec-idioma');
      if(l && l !== currentLang && typeof setLang === 'function') setLang(l);
    });
  }

  /* ---------- 4) recordar por dónde ibas en cada muestra ---------- */
  if(AJUSTES.muestra){
    const st = $('s-text');
    const clave = () => { const n = $('modal-overlay') && $('modal-overlay')._novel; return n ? 'ec-muestra:' + (n.id || n.title.es) + ':' + currentLang : null; };
    let espera = null;
    if(st) st.addEventListener('scroll', () => {
      clearTimeout(espera);
      espera = setTimeout(() => { const k = clave(); if(k) guardar(k, Math.round(st.scrollTop)); }, 250);
    });
    const abrir = window.openSampleView;
    if(typeof abrir === 'function') window.openSampleView = function(){
      const r = abrir.apply(this, arguments);
      const k = clave(), y = k && +leer(k);
      if(st && y > 0) requestAnimationFrame(() => { st.scrollTop = y; });
      return r;
    };
  }

  /* ---------- 5) pantallas táctiles ---------- */
  if(AJUSTES.tactil){
    const css = document.createElement('style');
    css.textContent = `
    @media (hover: none){
      .serie-cover-item img:not(.cover-shop-btn img){ filter: none; }
      .rombo .r-cover{ opacity: .62; }
    }`;
    document.head.appendChild(css);
  }
})();
