/* Пасека «Гнездино» — скрипт страницы.
   Бэкенда нет, сайт статический (лежит на GitHub Pages), так что тут
   только год в подвале и крупный просмотр фотографий. */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- год в подвале ---------- */

  // В разметке стоит 2026 на случай, если скрипт не загрузится
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());


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
