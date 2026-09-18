/* Пасека «Гнездино» — вся логика страницы.
   Бэкенда нет: сайт статический и целиком живёт на GitHub Pages.
   Здесь только четыре вещи: мобильное меню, фон шапки при прокрутке,
   подсветка текущего раздела и просмотр фотографий крупно. */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- год в подвале ---------- */

  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---------- шапка: фон появляется после первого экрана ---------- */

  const topbar = document.getElementById('topbar');

  const updateTopbar = () => {
    // 80% высоты экрана — примерно там заканчивается первый экран
    topbar.classList.toggle('is-stuck', window.scrollY > window.innerHeight * 0.8);
  };

  updateTopbar();
  window.addEventListener('scroll', updateTopbar, { passive: true });

  /* ---------- мобильное меню ---------- */

  const burger = document.getElementById('burger');
  const nav = document.getElementById('topbar-nav');

  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  // После перехода по ссылке меню закрываем — иначе оно перекрывает раздел
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- подсветка текущего раздела ---------- */

  const navLinks = Array.from(nav.querySelectorAll('a[data-nav]'));
  const sections = navLinks
    .map((link) => document.getElementById(link.dataset.nav))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => {
          link.classList.toggle('is-current', link.dataset.nav === entry.target.id);
        });
      });
    }, {
      // считаем активным тот раздел, который сейчас в середине экрана
      rootMargin: '-45% 0px -50% 0px',
    });

    sections.forEach((section) => spy.observe(section));
  }

  /* ---------- просмотр фотографий крупно ---------- */

  const shots = Array.from(document.querySelectorAll('.shot'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');

  let currentIndex = 0;      // какой снимок открыт
  let lastFocused = null;    // куда вернуть фокус после закрытия

  function showShot(index) {
    // по кругу: после последнего снова первый
    currentIndex = (index + shots.length) % shots.length;

    const shot = shots[currentIndex];
    const preview = shot.querySelector('img');

    lightboxImg.src = shot.dataset.src;
    lightboxImg.alt = preview ? preview.alt : '';
    lightboxCaption.textContent = shot.dataset.caption || '';
  }

  function openLightbox(index) {
    lastFocused = document.activeElement;
    showShot(index);

    lightbox.hidden = false;
    document.body.style.overflow = 'hidden'; // страница под просмотром не скроллится
    document.getElementById('lightbox-close').focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = '';
    document.body.style.overflow = '';

    if (lastFocused) lastFocused.focus();
  }

  shots.forEach((shot, index) => {
    shot.addEventListener('click', () => openLightbox(index));
  });

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev').addEventListener('click', () => showShot(currentIndex - 1));
  document.getElementById('lightbox-next').addEventListener('click', () => showShot(currentIndex + 1));

  // Клик по тёмному фону (а не по кнопкам или самой фотографии) тоже закрывает
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;

    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') showShot(currentIndex - 1);
    if (event.key === 'ArrowRight') showShot(currentIndex + 1);
  });
});
