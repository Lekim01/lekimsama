/* =========================================================
   rayas_web.js — [Nuevo] EL TÍTULO «NOVELAS ACTUALES», CON RAYAS
   (la misma idea que titulo_menu.js de la novela visual)

   - El texto del título va relleno de rayas verticales finas,
     blancas y gris perla, en vez del dorado.
   - Debajo, en vez de la línea dorada, una línea en píxeles de la
     que cuelgan 8 rayas como las gotas del corazón de Reki: una por
     novela, cada una con el color de su novela (la serie ya está
     completa). Bajan despacio al aparecer y, de vez en cuando, una
     suelta una gotita que cae y se desvanece.
   - Contornos nítidos, sin sombras difuminadas.

   Todo se dibuja en píxeles con canvas (sin imágenes). Para quitarlo,
   basta con borrar su línea <script src="rayas_web.js"> del HTML.
   ========================================================= */
(function(){
  const titulo = document.getElementById('catalog-title');
  if(!titulo) return;

  const BLANCO = '#f4f2ee', GRIS = '#d9d5cd';
  // colores de cada novela, en su orden: Infelicidad, Verdad, Ganar, Valor, Perder, Soñar, Temer, Ser
  const COLORES_NOVELAS = ['#d9b52a', '#2a6496', '#2e7d3a', '#d9782a', '#7b3f8c', '#6b6b6b', '#c0302a', '#7a1515'];
  const aclarar = (hex, f) => { const n = parseInt(hex.slice(1), 16); const c = k => Math.round(((n >> k) & 255) + (255 - ((n >> k) & 255)) * f); return `rgb(${c(16)},${c(8)},${c(0)})`; };
  const oscurecer = (col, f) => { const m = col.match(/\d+/g) || [200, 200, 200]; return `rgb(${m.slice(0, 3).map(v => Math.round(v * f)).join(',')})`; };
  const quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- estilo del texto ---------- */
  const st = document.createElement('style');
  st.textContent = `
  #catalog-title.titulo-rayado{ border-bottom: none; position: relative; padding-bottom: .55rem; margin-bottom: 34px; }
  #catalog-title.titulo-rayado span{ color: transparent; -webkit-text-fill-color: transparent; -webkit-background-clip: text; background-clip: text;
    background-image: repeating-linear-gradient(90deg, ${BLANCO} 0 3px, ${GRIS} 3px 5px);
    -webkit-text-stroke: .4px rgba(0,0,0,.9); }
  #rayas-web{ position: absolute; left: 50%; top: 100%; transform: translateX(-50%); image-rendering: pixelated; pointer-events: none; }`;
  document.head.appendChild(st);
  titulo.classList.add('titulo-rayado');

  /* ---------- las rayas que cuelgan, en píxeles ---------- */
  const ESCALA = 3, ALTO = 11;
  const SITIOS = [.11, .22, .33, .45, .56, .67, .78, .89];
  const LARGOS = [3, 6, 3, 7, 5, 6, 3, 4];
  const cv = document.createElement('canvas'); cv.id = 'rayas-web';
  const cx = cv.getContext('2d');
  let ancho = 0, crecer = quieto ? 1 : 0, gotitas = [], ultimo = 0, proxima = 0;

  function colorRaya(k){ return BLANCO; }   // [Cambiado] pedido del autor: solo blancas (para teñirlas de nuevo: aclarar(COLORES_NOVELAS[k], .42))
  function medir(){
    ancho = Math.max(60, Math.round(titulo.offsetWidth / ESCALA));
    cv.width = ancho; cv.height = ALTO;
    cv.style.width = (ancho * ESCALA) + 'px'; cv.style.height = (ALTO * ESCALA) + 'px';
  }
  function px(x, y, col){ cx.fillStyle = col; cx.fillRect(x, y, 1, 1); }
  function dibujar(){
    cx.clearRect(0, 0, cv.width, cv.height);
    for(let x = 0; x < ancho; x++){                              // la línea: clara en el centro, se pierde en los extremos
      const d = Math.abs(x / (ancho - 1) - .5) * 2;
      if(d > .97) continue;
      cx.globalAlpha = d < .6 ? 1 : 1 - (d - .6) / .37;
      px(x, 0, d < .6 ? BLANCO : GRIS); cx.globalAlpha = 1;
    }
    SITIOS.forEach((f, k) => {
      const x0 = Math.round(f * (ancho - 3)), col = colorRaya(k), sombra = oscurecer(col, .72);
      const largo = Math.max(0, Math.round(LARGOS[k] * crecer));
      for(let y = 1; y <= largo; y++){
        const punta = y === largo;
        px(x0, y, sombra);
        if(!punta) px(x0 + 1, y, y < 3 ? BLANCO : col);
      }
      if(largo > 0) px(x0 + 1, largo, col);
    });
    gotitas.forEach(g => { cx.globalAlpha = Math.max(0, g.a); px(g.x, Math.round(g.y), g.col); cx.globalAlpha = 1; });
  }
  function visible(){ const s = document.getElementById('series-cover-screen'); return !s || s.offsetParent !== null; }
  function bucle(t){
    requestAnimationFrame(bucle);
    if(!visible()) return;
    const dt = Math.min(.05, (t - (ultimo || t)) / 1000); ultimo = t;
    if(crecer < 1) crecer = Math.min(1, crecer + dt / 1.6);
    if(!quieto && crecer >= 1 && t > proxima){
      const k = Math.floor(Math.random() * SITIOS.length);
      gotitas.push({ x: Math.round(SITIOS[k] * (ancho - 3)) + 1, y: LARGOS[k] + 1, v: 6, a: 1, col: colorRaya(k) });
      proxima = t + 5000 + Math.random() * 6000;
    }
    gotitas.forEach(g => { g.v += 14 * dt; g.y += g.v * dt; g.a -= dt * .9; });
    gotitas = gotitas.filter(g => g.a > 0 && g.y < ALTO);
    dibujar();
  }

  titulo.appendChild(cv);
  medir(); dibujar();
  if(window.ResizeObserver) new ResizeObserver(() => { medir(); dibujar(); }).observe(titulo);
  else window.addEventListener('resize', () => { medir(); dibujar(); });
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(() => { medir(); dibujar(); });
  requestAnimationFrame(bucle);
})();
