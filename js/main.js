/* Пасека «Гнездино» — скрипт страницы.
   Бэкенда нет, сайт статический (лежит на GitHub Pages), так что тут
   только интерфейсные мелочи: шапка, меню на телефоне, подсветка раздела
   в меню и крупный просмотр фотографий. */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- год в подвале ---------- */

  // В разметке стоит 2026 на случай, если скрипт не загрузится
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());


  /* ---------- шапка ---------- */

  const topbar = document.getElementById('topbar');

  // Пока виден первый экран, шапка прозрачная. Как только он почти
  // уехал вверх (порог — 80% высоты окна), даём ей фон.
  function updateTopbar() {
    topbar.classList.toggle('is-stuck', window.scrollY > window.innerHeight * 0.8);
  }

  updateTopbar();
  window.addEventListener('scroll', updateTopbar, { passive: true });


  /* ---------- меню на телефоне ---------- */

  const burger = document.getElementById('burger');
  const nav = document.getElementById('topbar-nav');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  }

  burger.addEventListener('click', () => {
    setMenu(!nav.classList.contains('is-open'));
  });

  // Перешли по ссылке — меню убираем, иначе оно так и висит над разделом
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  // Тап мимо меню и Esc тоже закрывают его
  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (nav.contains(event.target) || burger.contains(event.target)) return;
    setMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
    }
  });


  /* ---------- подсветка текущего раздела в меню ---------- */

  const navLinks = Array.from(nav.querySelectorAll('a[data-nav]'));

  // Следим за разделами из меню и ещё за первым экраном: когда он
  // на виду, подсвечивать в меню нечего
  const watched = ['hero', ...navLinks.map((link) => link.dataset.nav)]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && watched.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => {
          link.classList.toggle('is-current', link.dataset.nav === entry.target.id);
        });
      });
    }, {
      // «активный» — тот раздел, который сейчас пересекает середину экрана
      rootMargin: '-45% 0px -50% 0px',
    });

    watched.forEach((section) => spy.observe(section));
  }


  /* ---------- просмотр фотографий крупно ---------- */

  const shots = Array.from(document.querySelectorAll('.shot'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCount = document.getElementById('lightbox-count');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if (!shots.length || !lightbox) return;

  let currentIndex = 0;   // какой снимок открыт сейчас
  let lastFocused = null; // на чём был фокус до открытия — туда и вернёмся

  function showShot(index) {
    // листаем по кругу: после последнего снова первый
    currentIndex = (index + shots.length) % shots.length;

    const shot = shots[currentIndex];
    const preview = shot.querySelector('img');

    lightboxImg.src = shot.dataset.src;
    lightboxImg.alt = preview ? preview.alt : '';
    lightboxCaption.textContent = shot.dataset.caption || '';
    lightboxCount.textContent = (currentIndex + 1) + ' / ' + shots.length;

    // Заранее подгружаем соседей, чтобы при листании не было пустой паузы
    [currentIndex - 1, currentIndex + 1].forEach((i) => {
      const neighbour = shots[(i + shots.length) % shots.length];
      new Image().src = neighbour.dataset.src;
    });
  }

  function openLightbox(index) {
    lastFocused = document.activeElement;
    showShot(index);

    lightbox.hidden = false;
    document.body.style.overflow = 'hidden'; // страница под фото не должна прокручиваться
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.removeAttribute('src');
    document.body.style.overflow = '';

    if (lastFocused) lastFocused.focus();
  }

  shots.forEach((shot, index) => {
    shot.addEventListener('click', () => openLightbox(index));
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => showShot(currentIndex - 1));
  nextBtn.addEventListener('click', () => showShot(currentIndex + 1));

  // Клик по тёмному фону (не по кнопкам и не по самой фотографии) — закрыть
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;

    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') showShot(currentIndex - 1);
    if (event.key === 'ArrowRight') showShot(currentIndex + 1);

    // Не даём Tab уйти на страницу под просмотром: крутим по трём кнопкам
    if (event.key === 'Tab') {
      const buttons = [closeBtn, prevBtn, nextBtn];
      const at = buttons.indexOf(document.activeElement);
      const step = event.shiftKey ? -1 : 1;

      event.preventDefault();
      buttons[(at + step + buttons.length) % buttons.length].focus();
    }
  });

  // Свайп пальцем влево/вправо. Считаем жестом только заметное движение
  // по горизонтали, чтобы не путать с обычной прокруткой или случайным касанием.
  let touchStartX = 0;
  let touchStartY = 0;

  lightbox.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  }, { passive: true });

  lightbox.addEventListener('touchend', (event) => {
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    showShot(currentIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });
});
