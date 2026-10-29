/* Ello Security — script.js
   Módulos: Navigation · Year · Masks · Validators · Forms
   Sem dependências externas e sem cookies/armazenamento local. */

const Navigation = (() => {
  const desktop = window.matchMedia('(min-width: 961px)');

  function init() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('#nav');
    if (!toggle || !nav) return;

    if (!toggle.querySelector('.menu-toggle-box')) {
      toggle.innerHTML = '<span class="menu-toggle-box" aria-hidden="true"><span class="menu-toggle-line"></span><span class="menu-toggle-line"></span><span class="menu-toggle-line"></span></span>';
    }

    if (!desktop.matches && !nav.classList.contains('open')) {
      nav.setAttribute('aria-hidden', 'true');
    }

    const setMenu = (open) => {
      nav.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      if (open) {
        nav.removeAttribute('aria-hidden');
      } else if (!desktop.matches) {
        nav.setAttribute('aria-hidden', 'true');
      }
    };

    const items = [...nav.querySelectorAll('.has-menu')];
    const setItem = (li, open) => {
      li.classList.toggle('open', open);
      li.querySelector('.menu-btn')?.setAttribute('aria-expanded', String(open));
    };
    const closeItems = (except) => items.forEach((li) => { if (li !== except) setItem(li, false); });

    toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));

    // CTAs "Conheça nossas soluções": abrem o menu Soluções (não há mais seção de soluções na home).
    document.querySelectorAll('[data-open-menu]').forEach((a) => a.addEventListener('click', (e) => {
      const li = document.getElementById('menu-' + a.dataset.openMenu)?.closest('.has-menu');
      if (!li) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (!desktop.matches) setMenu(true);
      closeItems(li); setItem(li, true);
      li.querySelector('.submenu a')?.focus({ preventScroll: true });
    }));

    items.forEach((li) => {
      const btn = li.querySelector('.menu-btn');
      btn.addEventListener('click', () => {
        const willOpen = !li.classList.contains('open');
        closeItems(li);
        setItem(li, willOpen);
      });
      li.addEventListener('mouseenter', () => { if (desktop.matches) { closeItems(li); setItem(li, true); } });
      li.addEventListener('mouseleave', () => { if (desktop.matches) setItem(li, false); });
      li.addEventListener('focusout', (e) => { if (!li.contains(e.relatedTarget)) setItem(li, false); });
    });

    nav.querySelectorAll('.submenu a').forEach((a) => a.addEventListener('click', () => { closeItems(); setMenu(false); }));
    nav.querySelectorAll('.nav-list > li > a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const openItem = items.find((li) => li.classList.contains('open'));
      if (openItem) { setItem(openItem, false); openItem.querySelector('.menu-btn').focus(); return; }
      if (nav.classList.contains('open')) { setMenu(false); toggle.focus(); }
    });
    document.addEventListener('click', (e) => { if (e.target.closest('[data-open-menu]')) return; if (!nav.contains(e.target) && !toggle.contains(e.target)) closeItems(); });
    desktop.addEventListener('change', () => {
      setMenu(false);
      closeItems();
      if (desktop.matches) {
        nav.removeAttribute('aria-hidden');
      } else {
        nav.setAttribute('aria-hidden', 'true');
      }
    });

    // aria-current nos links que apontam para a página atual
    const here = location.pathname.replace(/index\.html$/, '');
    nav.querySelectorAll('a[href]').forEach((a) => {
      const path = new URL(a.getAttribute('href'), location.href).pathname.replace(/index\.html$/, '');
      if (path === here) a.setAttribute('aria-current', 'page');
    });
  }
  return { init };
})();

const Year = {
  init() { document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); }); },
};

const digits = (v) => v.replace(/\D/g, '');

const Masks = (() => {
  const cnpj = (v) => digits(v).slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');

  const phone = (v) => {
    const d = digits(v).slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  function init() {
    const bind = (selector, fn) => document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener('input', () => { el.value = fn(el.value); });
    });
    bind('[data-mask="cnpj"]', cnpj);
    bind('[data-mask="phone"]', phone);
  }
  return { init };
})();

const Validators = {
  cnpj(value) {
    const d = digits(value);
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    const check = (len) => {
      const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const r = w.reduce((s, n, i) => s + n * Number(d[i]), 0) % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return check(12) === Number(d[12]) && check(13) === Number(d[13]);
  },
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
  phone: (v) => [10, 11].includes(digits(v).length),
};

/* Configuração de formulários institucionais (ES-020).
   Modo 'live': formulários funcionais com envio seguro via HTTPS ao endpoint configurado.
   Destino homologado: sac@ellosecurity.com.br.
   Proteções ativas: validação no cliente e servidor, honeypot (_gotcha), time-gate e rate limiting. */
const FORM_CONFIG = Object.freeze({
  mode: 'live',
  endpoint: '/api/submit-form',
  allowedOrigins: Object.freeze([
    'https://ellosecurity.com.br',
    'https://www.ellosecurity.com.br'
  ]),
  fields: Object.freeze([
    'nome', 'cargo', 'razao_social', 'cnpj', 'email', 'whatsapp',
    'faturamento', 'modalidade', 'area', 'consentimento',
    '_form_type', '_time_token', '_gotcha'
  ]),
});

const liveEndpoint = () => {
  if (FORM_CONFIG.mode !== 'live' || !FORM_CONFIG.endpoint) return null;
  const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (location.protocol !== 'https:' && !isLocal) return null;
  try {
    const url = new URL(FORM_CONFIG.endpoint, location.origin);
    if (!isLocal && url.protocol !== 'https:' && !FORM_CONFIG.allowedOrigins.includes(url.origin)) {
      return null;
    }
    return url.href;
  } catch (err) { return null; }
};

/* Formulários funcionais. Validação no cliente e no servidor, feedback visual e integridade dos dados. */
const Forms = (() => {
  const errorFor = (field) => {
    if (field.type === 'checkbox') return field.required && !field.checked ? 'Aceite o termo para continuar.' : '';
    const value = field.value.trim();
    if (!value) return field.required ? 'Preencha este campo.' : '';
    if (field.dataset.validate === 'cnpj' && !Validators.cnpj(value)) return 'CNPJ inválido. Confira os 14 dígitos.';
    if (field.dataset.validate === 'phone' && !Validators.phone(value)) return 'Informe DDD e número, ex.: (11) 91234-5678.';
    if (field.type === 'email' && !Validators.email(value)) return 'Informe um e-mail válido, ex.: nome@empresa.com.br.';
    return '';
  };

  const mark = (field) => {
    const msg = errorFor(field);
    const holder = field.closest('.field') || field.closest('.consent');
    const out = holder?.querySelector('.error-msg');
    if (out) out.textContent = msg;
    if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
    return msg;
  };

  function setup(form) {
    const timeInput = form.querySelector('[name="_time_token"]');
    if (timeInput) timeInput.value = Date.now().toString();

    const status = form.querySelector('.form-status');
    const say = (msg, type, details) => {
      status.className = `form-status ${type}`;
      if (type === 'success') {
        status.innerHTML = '<strong>Solicitação enviada com sucesso.</strong><p>Recebemos suas informações. Nossa equipe entrará em contato pelo canal informado.</p>';
      } else if (type === 'error' && details) {
        status.innerHTML = `<strong>Não foi possível concluir o envio:</strong><p>${details}</p>`;
      } else if (type === 'error') {
        status.innerHTML = `<strong>Não foi possível concluir o envio:</strong><p>${msg}</p>`;
      } else {
        status.textContent = msg;
      }
    };

    form.querySelectorAll('input, select, textarea').forEach((f) => {
      f.addEventListener('blur', () => { if (f.value || f.type === 'checkbox') mark(f); });
      f.addEventListener('input', () => { if (f.getAttribute('aria-invalid')) mark(f); });
      f.addEventListener('change', () => { if (f.getAttribute('aria-invalid')) mark(f); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fields = [...form.querySelectorAll('input, select, textarea')];
      const invalid = fields.filter((f) => mark(f));
      if (invalid.length) {
        invalid[0].focus();
        say(`Há ${invalid.length} campo(s) a corrigir. Revise as mensagens indicadas.`, 'error');
        return;
      }

      // Barreira antispam local: honeypot
      const gotcha = form.querySelector('[name="_gotcha"]')?.value;
      if (gotcha) {
        say('', 'success');
        form.reset();
        return;
      }

      // Barreira antispam local: time-gate
      const loadTime = parseInt(timeInput?.value || '0', 10);
      if (loadTime && (Date.now() - loadTime < 1500)) {
        say('Preenchimento muito rápido. Por favor, revise as informações e tente novamente.', 'error');
        return;
      }

      const endpoint = liveEndpoint();
      if (!endpoint) {
        say('Canal em manutenção técnica temporária. Por favor, envie sua mensagem diretamente para sac@ellosecurity.com.br.', 'error');
        return;
      }

      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      say('Enviando informações com segurança…', 'info');
      try {
        const payload = Object.fromEntries(
          [...new FormData(form).entries()].filter(([k]) => FORM_CONFIG.fields.includes(k))
        );
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          body: JSON.stringify(payload),
        });

        let json = null;
        try { json = await res.json(); } catch (err) {}

        if (!res.ok) {
          const errDetail = json?.error || (res.status === 429 ? 'Limite de tentativas atingido. Por favor, aguarde alguns minutos antes de tentar novamente.' : 'Falha na comunicação com o servidor.');
          throw new Error(errDetail);
        }

        form.reset();
        if (timeInput) timeInput.value = Date.now().toString();
        say('', 'success');
      } catch (err) {
        // Preserva os dados preenchidos no formulário para nova tentativa
        say(err.message || 'Verifique sua conexão e tente novamente. Os dados continuam preenchidos.', 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  function init() { document.querySelectorAll('form[data-form]').forEach(setup); }
  return { init };
})();

/* Carrossel do hero.
   Sem bibliotecas. Fade, avanço automático de 6 s, setas, indicadores, teclado e toque.
   Pausa com hover, foco, toque, aba oculta e pelo botão de pausa; com prefers-reduced-motion
   não há avanço automático. O avanço automático nunca move o foco do usuário.
   Apenas a 1ª imagem carrega com a página; as demais (data-src) carregam sob demanda. */
const Carousel = (() => {
  function setup(root) {
    const slides = [...root.querySelectorAll('.slide')];
    const dots = [...root.querySelectorAll('.car-dots button')];
    const prevBtn = root.querySelector('.car-arrow.prev');
    const nextBtn = root.querySelector('.car-arrow.next');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    let index = 0;
    let timer = null;
    let userPaused = reduced.matches;
    let hovering = false;
    let touching = false;
    let isVisible = true;

    // Mobile: 5 segundos (ES-025); Desktop/Tablet: 6 segundos preservados
    const getInterval = () => (mobileQuery.matches ? 5000 : 6000);

    // Carrega (e decodifica) a imagem do slide; resolve quando pronta, com limite de tempo.
    const loadSlide = (i) => {
      const img = slides[(i + slides.length) % slides.length].querySelector('.slide-img');
      if (!img) return Promise.resolve();
      img.parentElement.querySelectorAll('source[data-srcset]').forEach((s) => { s.srcset = s.dataset.srcset; s.removeAttribute('data-srcset'); });
      if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
      const ready = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
      return Promise.race([ready, new Promise((r) => setTimeout(r, 4000))]);
    };

    // Foco só pausa quando vem do teclado (:focus-visible); clique de mouse não deve parar o avanço.
    const keyboardFocus = () => { try { return !!root.querySelector(":focus-visible"); } catch (e) { return root.contains(document.activeElement); } };
    const playing = () => !userPaused && !hovering && !touching && !document.hidden && isVisible && !keyboardFocus();

    let token = 0;
    let preloadNext = false; // só depois do carregamento da página
    const show = async (i) => {
      const target = (i + slides.length) % slides.length;
      const mine = ++token;
      dots.forEach((d, n) => { if (n === target) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      await loadSlide(target); // evita fade-in de um slide ainda sem imagem
      if (mine !== token) return;
      activate(target);
      if (preloadNext) loadSlide(index + 1);
    };
    const activate = (target) => {
      index = target;
      slides.forEach((s, n) => {
        const on = n === index;
        s.classList.toggle('is-active', on);
        s.toggleAttribute('inert', !on);
        s.setAttribute('aria-hidden', String(!on));
      });
    };

    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => {
      stop();
      if (playing()) timer = setInterval(() => show(index + 1), getInterval());
      root.setAttribute('aria-live', timer ? 'off' : 'polite'); // anuncia trocas só quando não são automáticas
    };
    const go = (i) => { show(i); start(); };

    if (prevBtn) prevBtn.addEventListener('click', () => go(index - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => go(index + 1));
    dots.forEach((d, n) => d.addEventListener('click', () => go(n)));

    const setPaused = (paused) => {
      userPaused = paused;
      start();
    };

    root.addEventListener('mouseenter', () => { hovering = true; start(); });
    root.addEventListener('mouseleave', () => { hovering = false; start(); });
    root.addEventListener('focusin', start);
    root.addEventListener('focusout', () => setTimeout(start, 0));
    document.addEventListener('visibilitychange', start);
    reduced.addEventListener('change', (e) => setPaused(e.matches));
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', () => start());
    }

    root.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      const keys = { ArrowLeft: () => go(index - 1), ArrowRight: () => go(index + 1), Home: () => go(0), End: () => go(slides.length - 1) };
      if (keys[e.key]) { e.preventDefault(); keys[e.key](); }
    });

    // --- Gesto de deslize horizontal por toque (Swipe no mobile) ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    root.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1 || e.target.closest('button, a')) return;
      touching = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      stop();
    }, { passive: true });

    root.addEventListener('touchend', (e) => {
      if (!touching) return;
      touching = false;
      const elapsed = Date.now() - touchStartTime;
      if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;

        // Limiar de swipe: deslocamento horizontal mínimo de 36px, preponderância sobre o eixo vertical, até 650ms
        if (Math.abs(deltaX) >= 36 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2 && elapsed <= 650) {
          if (deltaX < 0) {
            // Deslize para a esquerda -> Próximo slide (circular)
            go(index + 1);
            return;
          } else {
            // Deslize para a direita -> Slide anterior (circular)
            go(index - 1);
            return;
          }
        }
      }
      start();
    }, { passive: true });

    root.addEventListener('touchcancel', () => {
      touching = false;
      start();
    }, { passive: true });

    // Observador de visibilidade (IntersectionObserver)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) start();
          else stop();
        });
      }, { threshold: 0.15 });
      observer.observe(root);
    }

    activate(0);
    // Imagens seguintes só depois que a página (e a 1ª imagem) terminarem de carregar.
    const afterLoad = () => (window.requestIdleCallback || ((f) => setTimeout(f, 800)))(() => { preloadNext = true; loadSlide(index + 1); });
    if (document.readyState === 'complete') afterLoad(); else window.addEventListener('load', afterLoad, { once: true });
    start();
  }

  function init() { document.querySelectorAll('[data-carousel]').forEach(setup); }
  return { init };
})();

/* Janela cinematográfica com vídeo contínuo em segundo plano (ES-020 — Referência Tauri).
   Sem scroll-pinning, sem travamento de tela e sem transformações de zoom.
   O vídeo toca continuamente ao fundo da janela enquanto o usuário rola livremente pela página.
   Sensação sutil de profundidade por leve deslocamento vertical interno, com escala estável.
   Vídeo e poster só carregam após o load e perto da tela (sem afetar LCP).
   Respeita prefers-reduced-motion e Save-Data. */
const Cinema = (() => {
  function setup(root) {
    const video = root.querySelector('.cine-video');
    const media = root.querySelector('[data-cine-media]');
    const toggle = root.querySelector('.cine-toggle');
    if (!video) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia('(min-width: 769px)');
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    let loaded = false, visible = false, near = false, userPaused = false, ticking = false;
    video.muted = true; video.defaultMuted = true;

    const play = () => {
      if (!loaded || !visible || userPaused || reduced.matches) return;
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    };
    const pause = () => { if (loaded) video.pause(); };

    function load() {
      if (loaded || !near || document.readyState !== 'complete') return;
      loaded = true;
      if (video.dataset.poster) video.poster = video.dataset.poster;
      if (reduced.matches || saveData) return; // apresentação estática: apenas o poster
      const source = document.createElement('source');
      source.src = video.dataset.src;
      source.type = 'video/mp4';
      video.appendChild(source);
      video.load();
      play();
    }

    // Efeito sutil de janela em profundidade (deslocamento vertical leve SEM alteração de escala)
    function updateDepth() {
      ticking = false;
      if (!media || !visible || reduced.matches || !wide.matches) {
        if (media) media.style.transform = '';
        return;
      }
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      const shiftY = ((0.5 - p) * 10).toFixed(2);
      media.style.transform = `translate3d(0, ${shiftY}%, 0)`;
    }

    const onScroll = () => {
      if (!ticking && visible) {
        ticking = true;
        requestAnimationFrame(updateDepth);
      }
    };

    // Carrega quando a seção se aproxima da tela
    new IntersectionObserver((es) => {
      near = es.some((e) => e.isIntersecting);
      load();
    }, { rootMargin: wide.matches ? '400px 0px' : '0px' }).observe(root);

    // Reproduz quando visível e pausa quando fora da viewport
    new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting);
      if (visible) {
        play();
        updateDepth();
      } else {
        pause();
      }
    }).observe(root);

    if (document.readyState !== 'complete') window.addEventListener('load', load, { once: true });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    reduced.addEventListener('change', () => {
      updateDepth();
      if (reduced.matches) pause(); else play();
    });
    wide.addEventListener('change', updateDepth);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else play(); });

    if (toggle) {
      toggle.addEventListener('click', () => {
        userPaused = !userPaused;
        toggle.setAttribute('aria-pressed', String(userPaused));
        toggle.setAttribute('aria-label', userPaused ? 'Retomar o vídeo de fundo' : 'Pausar o vídeo de fundo');
        toggle.textContent = userPaused ? 'Retomar vídeo' : 'Pausar vídeo';
        if (userPaused) pause(); else play();
      });
    }
  }
  function init() { document.querySelectorAll('.cine').forEach(setup); }
  return { init };
})();

/* Faixa "Quem somos" com vídeo de fundo: a fonte só é anexada perto da tela, toca apenas
   enquanto visível e, com movimento reduzido ou economia de dados, fica só o poster. */
const BandVideo = (() => {
  function setup(video) {
    const band = video.closest('.photo-band');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    let attached = false, visible = false;
    video.muted = true; video.defaultMuted = true;
    const play = () => { if (attached && visible && !reduced.matches) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } };
    new IntersectionObserver((es) => {
      if (!attached && es.some((e) => e.isIntersecting) && !reduced.matches && !saveData) {
        attached = true;
        const s = document.createElement('source');
        s.src = video.dataset.src; s.type = 'video/mp4';
        video.appendChild(s); video.load();
      }
    }, { rootMargin: '300px 0px' }).observe(band);
    new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting);
      if (visible) play(); else if (attached) video.pause();
    }).observe(band);
    video.addEventListener('canplay', play);
    document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); else play(); });
    reduced.addEventListener('change', () => { if (reduced.matches) video.pause(); else play(); });
  }
  function init() { document.querySelectorAll('.band-video').forEach(setup); }
  return { init };
})();

/* Header inteligente: some ao rolar para baixo, reaparece imediatamente ao rolar para cima,
   sempre visível perto do topo. Usa translateY (sem reflow), listener passivo + requestAnimationFrame,
   e uma tolerância de ~8px para não tremer em pequenas oscilações. Fica sempre visível quando um
   dropdown, o menu mobile ou o modal Área do Cliente estão abertos, ou quando o foco do teclado
   está dentro do header; respeita prefers-reduced-motion (não esconde o header). */
/* Explorador fotográfico de Soluções (home):
   - Desktop / Notebook: navegação lateral vertical com 8 itens, troca sob clique ou teclado (preservação integral).
   - Mobile e Tablet: carrossel cinematográfico automático a cada 5s, gestos de deslize horizontal (swipe),
     indicadores inferiores circulares em dourado institucional, pausa na interação/fora da tela e
     suporte a prefers-reduced-motion. */
const SolExplorer = (() => {
  function setup(root) {
    const nav = root.querySelector('[data-sol-nav]');
    const buttons = nav ? [...nav.querySelectorAll('.sol-nav-item')] : [];
    const stage = root.querySelector('.sol-stage');
    if (!stage) return;
    const live = stage.querySelector('.sol-stage-live');
    if (!live) return;
    const dotsContainer = root.querySelector('[data-sol-dots]');
    const dots = dotsContainer ? [...dotsContainer.querySelectorAll('.sol-dot')] : [];
    const total = Math.max(buttons.length, dots.length, stage.querySelectorAll('[data-sol-template]').length);
    if (total === 0) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 1024px)');
    let current = 0;
    let swapping = false;
    let timer = null;
    let isVisible = false;
    let isInteracting = false;

    const activate = (i, focus) => {
      if (swapping) return;
      if (i === current) {
        if (focus && buttons[i]) buttons[i].focus();
        return;
      }
      const tpl = stage.querySelector(`[data-sol-template="${i}"]`);
      if (!tpl) return;

      // Sincroniza botões desktop (se visíveis)
      buttons.forEach((b, n) => b.setAttribute('aria-current', String(n === i)));

      // Sincroniza indicadores mobile/tablet (dots)
      dots.forEach((d, n) => {
        const isActive = (n === i);
        d.classList.toggle('is-active', isActive);
        d.setAttribute('aria-selected', String(isActive));
        d.setAttribute('aria-current', String(isActive));
      });

      const swap = () => {
        live.replaceChildren(tpl.content.cloneNode(true));
        live.classList.remove('is-out');
        current = i;
        swapping = false;
      };

      if (reduced.matches) {
        swap();
      } else {
        swapping = true;
        live.classList.add('is-out');
        setTimeout(swap, 160);
      }
      if (focus && buttons[i]) buttons[i].focus();
    };

    // --- Controle do temporizador automático (exclusivo mobile/tablet) ---
    const startTimer = () => {
      stopTimer();
      // O avanço automático roda exclusivamente em telas móveis/tablets (<= 1024px)
      if (!mobileQuery.matches || reduced.matches || !isVisible || isInteracting || document.hidden) {
        return;
      }
      timer = setTimeout(() => {
        activate((current + 1) % total);
        startTimer();
      }, 5000);
    };

    const stopTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const restartTimer = () => {
      stopTimer();
      startTimer();
    };

    // --- Eventos nos botões de navegação desktop ---
    buttons.forEach((b, i) => {
      b.addEventListener('click', () => {
        activate(i);
        restartTimer();
      });
      b.addEventListener('keydown', (e) => {
        const next = {
          ArrowDown: (i + 1) % buttons.length,
          ArrowRight: (i + 1) % buttons.length,
          ArrowUp: (i - 1 + buttons.length) % buttons.length,
          ArrowLeft: (i - 1 + buttons.length) % buttons.length,
          Home: 0,
          End: buttons.length - 1
        }[e.key];
        if (next !== undefined) {
          e.preventDefault();
          activate(next, true);
          restartTimer();
        }
      });
    });

    // --- Eventos nos indicadores circulares (dots) mobile/tablet ---
    dots.forEach((d, i) => {
      d.addEventListener('click', () => {
        activate(i);
        restartTimer();
      });
      d.addEventListener('keydown', (e) => {
        const next = {
          ArrowRight: (i + 1) % dots.length,
          ArrowLeft: (i - 1 + dots.length) % dots.length,
          Home: 0,
          End: dots.length - 1
        }[e.key];
        if (next !== undefined) {
          e.preventDefault();
          activate(next);
          if (dots[next]) dots[next].focus();
          restartTimer();
        }
      });
    });

    // --- Gesto de deslize horizontal por toque (Swipe) ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isInteracting = true;
      stopTimer();
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      isInteracting = false;
      restartTimer();
      if (e.changedTouches.length !== 1) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const elapsed = Date.now() - touchStartTime;

      // Deslize horizontal detectado: deslocamento mínimo de 36px, preponderância horizontal, tempo <= 600ms
      if (Math.abs(deltaX) >= 36 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15 && elapsed <= 600) {
        if (deltaX < 0) {
          // Deslize para a esquerda -> Próxima solução (circular: 8 -> 1)
          activate((current + 1) % total);
        } else {
          // Deslize para a direita -> Solução anterior (circular: 1 -> 8)
          activate((current - 1 + total) % total);
        }
      }
    }, { passive: true });

    stage.addEventListener('touchcancel', () => {
      isInteracting = false;
      restartTimer();
    }, { passive: true });

    // Pausar reprodução durante hover do mouse
    stage.addEventListener('mouseenter', () => {
      isInteracting = true;
      stopTimer();
    });
    stage.addEventListener('mouseleave', () => {
      isInteracting = false;
      restartTimer();
    });

    // Pausar reprodução quando o foco de acessibilidade entra nos dots
    if (dotsContainer) {
      dotsContainer.addEventListener('focusin', () => {
        isInteracting = true;
        stopTimer();
      });
      dotsContainer.addEventListener('focusout', () => {
        isInteracting = false;
        restartTimer();
      });
    }

    // --- Observador de interseção (pausar fora do viewport) ---
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startTimer();
          } else {
            stopTimer();
          }
        });
      }, { threshold: 0.2 });
      observer.observe(root);
    } else {
      isVisible = true;
      startTimer();
    }

    // --- Pausar quando o documento não está visível ---
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    });

    // --- Monitorar alterações no tamanho de tela e acessibilidade ---
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', (e) => {
        if (e.matches) startTimer();
        else stopTimer();
      });
    }
    if (reduced.addEventListener) {
      reduced.addEventListener('change', (e) => {
        if (reduced.matches) stopTimer();
        else startTimer();
      });
    }
  }

  function init() {
    document.querySelectorAll('[data-sol-explorer]').forEach(setup);
  }

  return { init };
})();

const SmartHeader = (() => {
  function init() {
    const header = document.querySelector('.header');
    if (!header) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const THRESHOLD = 8;      // tolerância a pequenas variações de rolagem
    const TOP_GUARD = 80;     // sempre visível perto do topo
    let lastY = window.scrollY;
    let anchorY = lastY;
    let hidden = false;
    let ticking = false;

    const suspended = () =>
      reduced.matches ||
      header.contains(document.activeElement) ||
      document.getElementById('nav')?.classList.contains('open') ||
      [...header.querySelectorAll('.has-menu')].some((li) => li.classList.contains('open')) ||
      document.getElementById('client-modal')?.open;

    const setHidden = (v) => {
      if (hidden === v) return;
      hidden = v;
      header.classList.toggle('header-hidden', v);
    };

    const update = () => {
      ticking = false;
      const y = Math.max(0, window.scrollY);
      if (suspended()) { setHidden(false); anchorY = y; lastY = y; return; }
      if (y <= TOP_GUARD) { setHidden(false); anchorY = y; lastY = y; return; }
      const delta = y - anchorY;
      if (Math.abs(delta) < THRESHOLD) { lastY = y; return; }
      if (delta > 0) setHidden(true); else setHidden(false);
      anchorY = y;
      lastY = y;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });

    // Foco do teclado dentro do header (links, dropdowns, Área do Cliente) sempre o reexibe;
    // a checagem de suspended() a cada rolagem já cobre dropdown aberto, menu mobile e modal.
    header.addEventListener('focusin', () => setHidden(false));
  }
  return { init };
})();

/* Painéis de Segmentos (home):
   - Desktop e Tablet (>= 768px): painéis expansíveis (clique, toque ou hover com cursor fino)
   - Mobile (<= 767px): carrossel com avanço automático a cada 6s, swipe horizontal por toque,
     dots discretos com indicador dourado e reprodução circular infinita (ES-027). */
const SegPanels = (() => {
  function setup(root) {
    const panels = [...root.querySelectorAll('[data-seg-panel]')];
    if (panels.length === 0) return;
    const triggers = panels.map((p) => p.querySelector('.seg-panel-trigger'));
    const section = root.closest('.seg-panels-section') || root.parentElement;
    const dotsContainer = section ? section.querySelector('[data-seg-dots]') : null;
    const dots = dotsContainer ? [...dotsContainer.querySelectorAll('[data-seg-dot]')] : [];

    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    let current = panels.findIndex((p) => p.dataset.active === 'true');
    if (current === -1) current = 0;

    let timer = null;
    let isVisible = false;
    let isInteracting = false;

    const activate = (i, focus) => {
      current = (i + panels.length) % panels.length;
      panels.forEach((p, n) => {
        const on = n === current;
        if (on) p.dataset.active = 'true'; else delete p.dataset.active;
        if (triggers[n]) triggers[n].setAttribute('aria-expanded', String(on));
      });

      // Sincroniza indicadores (dots) mobile
      dots.forEach((d, n) => {
        const isActive = (n === current);
        d.classList.toggle('is-active', isActive);
        d.setAttribute('aria-selected', String(isActive));
        if (isActive) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });

      if (focus && triggers[current]) triggers[current].focus();
    };

    // --- Controle do temporizador de avanço automático (6 segundos, exclusivo mobile) ---
    const startTimer = () => {
      stopTimer();
      if (!mobileQuery.matches || reduced.matches || !isVisible || isInteracting || document.hidden) {
        return;
      }
      timer = setTimeout(() => {
        activate(current + 1);
        startTimer();
      }, 6000);
    };

    const stopTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const restartTimer = () => {
      stopTimer();
      startTimer();
    };

    // --- Eventos nos triggers do accordion (Desktop / Tablet) ---
    triggers.forEach((t, i) => {
      if (!t) return;
      t.addEventListener('click', () => {
        activate(i);
        if (mobileQuery.matches) restartTimer();
      });
      t.addEventListener('keydown', (e) => {
        const next = {
          ArrowRight: (i + 1) % triggers.length,
          ArrowLeft: (i - 1 + triggers.length) % triggers.length,
          Home: 0,
          End: triggers.length - 1
        }[e.key];
        if (next !== undefined) {
          e.preventDefault();
          activate(next, true);
          if (mobileQuery.matches) restartTimer();
        }
      });
    });

    // Hover desktop (expansão automática ao passar o mouse com cursor fino)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      panels.forEach((p, i) => p.addEventListener('mouseenter', () => {
        if (!mobileQuery.matches) activate(i);
      }));
    }

    // --- Eventos nos indicadores (dots) mobile ---
    dots.forEach((d, i) => {
      d.addEventListener('click', () => {
        activate(i);
        restartTimer();
      });
      d.addEventListener('keydown', (e) => {
        const next = {
          ArrowRight: (i + 1) % dots.length,
          ArrowLeft: (i - 1 + dots.length) % dots.length,
          Home: 0,
          End: dots.length - 1
        }[e.key];
        if (next !== undefined) {
          e.preventDefault();
          activate(next);
          if (dots[next]) dots[next].focus();
          restartTimer();
        }
      });
    });

    // --- Gesto de deslize horizontal por toque (Swipe mobile) ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const swipeTarget = root;

    swipeTarget.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1 || !mobileQuery.matches) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isInteracting = true;
      stopTimer();
    }, { passive: true });

    swipeTarget.addEventListener('touchend', (e) => {
      if (!mobileQuery.matches) return;
      isInteracting = false;
      restartTimer();
      if (e.changedTouches.length !== 1) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const elapsed = Date.now() - touchStartTime;

      // Deslize horizontal detectado: deslocamento mínimo de 36px, preponderância horizontal, tempo <= 600ms
      if (Math.abs(deltaX) >= 36 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15 && elapsed <= 600) {
        if (deltaX < 0) {
          // Deslize para a esquerda -> Próximo slide (circular: 5 -> 1)
          activate(current + 1);
        } else {
          // Deslize para a direita -> Slide anterior (circular: 1 -> 5)
          activate(current - 1);
        }
      }
    }, { passive: true });

    swipeTarget.addEventListener('touchcancel', () => {
      if (!mobileQuery.matches) return;
      isInteracting = false;
      restartTimer();
    }, { passive: true });

    // Pausar durante foco de acessibilidade nos dots
    if (dotsContainer) {
      dotsContainer.addEventListener('focusin', () => {
        isInteracting = true;
        stopTimer();
      });
      dotsContainer.addEventListener('focusout', () => {
        isInteracting = false;
        restartTimer();
      });
    }

    // --- Observador de interseção (pausar quando fora da viewport) ---
    if ('IntersectionObserver' in window && section) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startTimer();
          } else {
            stopTimer();
          }
        });
      }, { threshold: 0.15 });
      observer.observe(section);
    } else {
      isVisible = true;
      startTimer();
    }

    // Gerenciamento de visibilidade da aba do navegador
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopTimer();
      } else if (isVisible) {
        startTimer();
      }
    });

    // Alteração de preferência de movimento reduzido
    reduced.addEventListener('change', () => {
      if (reduced.matches) {
        stopTimer();
      } else if (isVisible) {
        startTimer();
      }
    });

    // Alteração de viewport (redimensionamento / rotação)
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', () => {
        if (mobileQuery.matches) {
          activate(current);
          startTimer();
        } else {
          stopTimer();
        }
      });
    }

    // Inicia imediatamente se em mobile
    if (mobileQuery.matches) {
      activate(current);
      startTimer();
    }
  }

  function init() { document.querySelectorAll('[data-seg-panels]').forEach(setup); }
  return { init };
})();

/* Modal acessível (<dialog> nativo: foco preso, Esc, retorno do foco ao acionador). */
const Modal = (() => {
  function init() {
    const openers = new Map(); // diálogo → último botão que o abriu (há mais de um acionador: cabeçalho e rodapé)
    const bound = new Set();
    document.querySelectorAll('[data-modal-open]').forEach((btn) => {
      const dialog = document.getElementById(btn.dataset.modalOpen);
      if (!dialog || typeof dialog.showModal !== 'function') return;
      btn.addEventListener('click', () => {
        openers.set(dialog, btn);
        const navEl = document.getElementById('nav');
        const toggleEl = document.querySelector('.menu-toggle');
        navEl?.classList.remove('open');
        toggleEl?.classList.remove('open');
        toggleEl?.setAttribute('aria-expanded', 'false');
        toggleEl?.setAttribute('aria-label', 'Abrir menu');
        if (window.innerWidth <= 960) navEl?.setAttribute('aria-hidden', 'true');
        dialog.showModal();
        dialog.querySelector('.btn, .modal-close')?.focus();
      });
      if (bound.has(dialog)) return;
      bound.add(dialog);
      dialog.querySelectorAll('[data-modal-close]').forEach((c) => c.addEventListener('click', () => dialog.close()));
      dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
      dialog.addEventListener('close', () => openers.get(dialog)?.focus());
    });
  }
  return { init };
})();

/* 9. Animações de surgimento ao rolar (Scroll Reveal — Referência Tauri) */
const Reveal = (() => {
  function init() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.08
    });

    targets.forEach((el) => observer.observe(el));
  }
  return { init };
})();

/* 10. Acordeão de FAQ animado — exclusivo da página Antecipação de Recebíveis (.sx-ar-faq-trigger);
   não afeta o <details> nativo usado nas demais páginas. Botão + painel com transição suave de
   altura/opacidade, medida dinamicamente (sem altura fixa), respeitando prefers-reduced-motion. */
const ArFaq = (() => {
  function init() {
    const triggers = document.querySelectorAll('.sx-ar-faq-trigger');
    if (!triggers.length) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    triggers.forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;

      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
          panel.style.maxHeight = panel.scrollHeight + 'px';
          // força reflow para o navegador registrar a altura atual antes de animar para 0
          // eslint-disable-next-line no-unused-expressions
          panel.offsetHeight;
          btn.setAttribute('aria-expanded', 'false');
          panel.setAttribute('aria-hidden', 'true');
          requestAnimationFrame(() => {
            panel.style.maxHeight = '0px';
            panel.style.opacity = '0';
          });
        } else {
          btn.setAttribute('aria-expanded', 'true');
          panel.removeAttribute('aria-hidden');
          panel.style.maxHeight = panel.scrollHeight + 'px';
          panel.style.opacity = '1';
          if (reduced) {
            panel.style.maxHeight = 'none';
          } else {
            const onEnd = (e) => {
              if (e.propertyName !== 'max-height') return;
              if (btn.getAttribute('aria-expanded') === 'true') panel.style.maxHeight = 'none';
              panel.removeEventListener('transitionend', onEnd);
            };
            panel.addEventListener('transitionend', onEnd);
          }
        }
      });
    });
  }
  return { init };
})();

/* Consentimento de cookies e gerenciamento de privacidade (LGPD). */
const CookieConsent = (() => {
  const STORAGE_KEY = 'ello_cookie_preferences';

  function getPreferences() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  function savePreferences(prefs) {
    try {
      const record = {
        necessary: true,
        analytics: Boolean(prefs.analytics),
        functional: Boolean(prefs.functional),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      window.dispatchEvent(new CustomEvent('ello:cookie-consent', { detail: record }));
      return record;
    } catch {
      return null;
    }
  }

  function init() {
    const banner = document.getElementById('cookie-banner');
    const btnAccept = document.getElementById('cookie-accept-all');
    const btnReject = document.getElementById('cookie-reject-all');

    const hideBanner = () => {
      if (banner) banner.hidden = true;
    };

    const showBanner = () => {
      if (banner) {
        banner.hidden = false;
        btnAccept?.focus();
      }
    };

    // Primeira visita: se ainda não houver escolha registrada, exibe o banner
    const existing = getPreferences();
    if (!existing) {
      if (banner) banner.hidden = false;
    }

    if (btnAccept) {
      btnAccept.addEventListener('click', () => {
        savePreferences({ analytics: true, functional: true });
        hideBanner();
      });
    }

    if (btnReject) {
      btnReject.addEventListener('click', () => {
        savePreferences({ analytics: false, functional: false });
        hideBanner();
      });
    }

    // Gatilho permanente no rodapé: Preferências de cookies (reabre o banner para revisão da escolha)
    document.querySelectorAll('[data-cookie-pref]').forEach((btn) => {
      btn.addEventListener('click', () => {
        showBanner();
      });
    });
  }

  return { init, getPreferences, savePreferences };
})();

/* Carrossel infinito não interativo para faixas institucionais no mobile (ES-024) */
const InstBreakCarousel = (() => {
  function init() {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const grids = document.querySelectorAll('.inst-break-grid, .about-principles-grid, .integ-principles-grid, [data-inst-carousel]');
    if (!grids.length) return;

    const instances = [];

    grids.forEach((grid) => {
      // Itens diferenciais filhos diretos
      const items = Array.from(grid.children).filter((el) =>
        el.classList.contains('inst-break-col') ||
        el.classList.contains('about-principle') ||
        el.classList.contains('integ-principle') ||
        el.hasAttribute('data-inst-item')
      );
      if (items.length <= 1) return;

      let currentIndex = 0;
      let timer = null;
      let isVisible = false;

      // Inicializa estados
      items.forEach((item, idx) => {
        if (mobileQuery.matches) {
          item.classList.toggle('is-active', idx === 0);
          if (idx === 0) item.removeAttribute('aria-hidden');
          else item.setAttribute('aria-hidden', 'true');
        } else {
          item.classList.remove('is-active');
          item.removeAttribute('aria-hidden');
        }
      });

      function showSlide(index) {
        if (index === currentIndex) return;
        items[currentIndex].classList.remove('is-active');
        items[currentIndex].setAttribute('aria-hidden', 'true');

        items[index].classList.add('is-active');
        items[index].removeAttribute('aria-hidden');
        currentIndex = index;
      }

      function nextSlide() {
        const next = (currentIndex + 1) % items.length;
        showSlide(next);
      }

      function startTimer() {
        stopTimer();
        if (!mobileQuery.matches || reducedMotion.matches || !isVisible || document.hidden) {
          return;
        }
        timer = setInterval(nextSlide, 4000);
      }

      function stopTimer() {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }

      // Observador de visibilidade (IntersectionObserver)
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
            if (isVisible) {
              startTimer();
            } else {
              stopTimer();
            }
          });
        }, { threshold: 0.15 });
        observer.observe(grid);
      } else {
        isVisible = true;
        startTimer();
      }

      instances.push({
        grid,
        items,
        startTimer,
        stopTimer,
        showSlide: (n) => showSlide(n)
      });
    });

    // Pausar/retomar quando a aba vai para segundo plano
    document.addEventListener('visibilitychange', () => {
      instances.forEach((inst) => {
        if (document.hidden) inst.stopTimer();
        else inst.startTimer();
      });
    });

    // Monitorar alterações no breakpoint mobile e em prefers-reduced-motion
    const handleQueryChange = () => {
      instances.forEach((inst) => {
        if (mobileQuery.matches && !reducedMotion.matches) {
          inst.items.forEach((item, idx) => {
            item.classList.toggle('is-active', idx === 0);
            if (idx === 0) item.removeAttribute('aria-hidden');
            else item.setAttribute('aria-hidden', 'true');
          });
          inst.startTimer();
        } else {
          inst.stopTimer();
          if (!mobileQuery.matches) {
            inst.items.forEach((item) => {
              item.classList.remove('is-active');
              item.removeAttribute('aria-hidden');
            });
          }
        }
      });
    };

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', handleQueryChange);
    }
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener('change', handleQueryChange);
    }
  }

  return { init };
})();

[Navigation, SmartHeader, Year, Masks, Forms, Carousel, Cinema, BandVideo, SolExplorer, SegPanels, Modal, Reveal, ArFaq, CookieConsent, InstBreakCarousel].forEach((m) => m.init());
