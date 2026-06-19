/**
 * Presentation Controller
 * Keyboard, click, touch/swipe navigation for slide deck
 * + Source-image modal for chart credibility (fade-in)
 */

(function () {
    'use strict';

    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    const progressBar = document.getElementById('progressBar');
    const slideCounter = document.getElementById('slideCounter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // --- SOURCE MODAL ELEMENTS ---
    const sourceModal = document.getElementById('sourceModal');
    const sourceModalBody = document.getElementById('sourceModalBody');
    const sourceModalTitle = document.getElementById('sourceModalTitle');
    const sourceModalClose = document.getElementById('sourceModalClose');

    // Slide → original chart/print images (shown as credibility pop-up before advancing)
    const slideSources = {};

    let currentSlide = 1;
    let isAnimating = false;
    let modalOpen = false;
    let modalShownThisVisit = false; // resets each time the user enters a new slide

    // --- CORE NAVIGATION ---
    function goToSlide(n) {
        if (isAnimating) return;
        if (n < 1 || n > totalSlides) return;
        if (n === currentSlide) return;

        isAnimating = true;
        modalShownThisVisit = false;

        const currentEl = document.querySelector(`.slide[data-slide="${currentSlide}"]`);
        const nextEl = document.querySelector(`.slide[data-slide="${n}"]`);

        if (currentEl) currentEl.classList.remove('active');
        if (nextEl) nextEl.classList.add('active');

        currentSlide = n;
        updateUI();

        setTimeout(() => {
            isAnimating = false;
        }, 600);
    }

    function nextSlide() {
        // Modal already open → close it AND advance
        if (modalOpen) {
            closeSourceModal();
            goToSlide(currentSlide + 1);
            return;
        }
        // First press on a slide that has a source image → open modal (don't advance yet)
        if (slideSources[currentSlide] && !modalShownThisVisit) {
            openSourceModal(currentSlide);
            return;
        }
        // Default: just advance
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        if (modalOpen) {
            closeSourceModal();
            return;
        }
        goToSlide(currentSlide - 1);
    }

    function updateUI() {
        const progress = (currentSlide / totalSlides) * 100;
        progressBar.style.width = progress + '%';

        slideCounter.textContent = `${currentSlide} / ${totalSlides}`;

        prevBtn.style.opacity = currentSlide === 1 ? '0.2' : '1';
        prevBtn.style.pointerEvents = currentSlide === 1 ? 'none' : 'auto';
        nextBtn.style.opacity = currentSlide === totalSlides ? '0.2' : '1';
        nextBtn.style.pointerEvents = currentSlide === totalSlides ? 'none' : 'auto';
    }

    // --- SOURCE MODAL ---
    function openSourceModal(slideNum) {
        const source = slideSources[slideNum];
        if (!source) return;

        sourceModalTitle.textContent = source.title;
        sourceModalBody.innerHTML = source.images.map(img => `
            <figure class="source-modal__figure">
                <img class="source-modal__image" src="${img.src}" alt="${img.caption}" />
                <figcaption class="source-modal__caption">${img.caption}</figcaption>
            </figure>
        `).join('');

        sourceModal.classList.add('active');
        sourceModal.setAttribute('aria-hidden', 'false');
        modalOpen = true;
        modalShownThisVisit = true;
    }

    function closeSourceModal() {
        sourceModal.classList.remove('active');
        sourceModal.setAttribute('aria-hidden', 'true');
        modalOpen = false;
    }

    sourceModalClose.addEventListener('click', closeSourceModal);
    sourceModal.addEventListener('click', (e) => {
        // Click outside inner panel closes modal (no advance)
        if (e.target === sourceModal) closeSourceModal();
    });

    // --- KEYBOARD NAV ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalOpen) {
                e.preventDefault();
                closeSourceModal();
            }
            return;
        }
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
            case 'PageDown':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                prevSlide();
                break;
            case 'Home':
                if (modalOpen) closeSourceModal();
                e.preventDefault();
                goToSlide(1);
                break;
            case 'End':
                if (modalOpen) closeSourceModal();
                e.preventDefault();
                goToSlide(totalSlides);
                break;
        }
    });

    // --- BUTTON NAV ---
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // --- TOUCH / SWIPE NAV ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const SWIPE_THRESHOLD = 50;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
            if (dx < 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }

    // --- MOUSE WHEEL NAV (debounced) ---
    let wheelTimeout = null;
    document.addEventListener('wheel', (e) => {
        // Don't hijack scroll inside the modal (lets the user scroll long images)
        if (modalOpen && sourceModal.contains(e.target)) return;
        if (wheelTimeout) return;
        wheelTimeout = setTimeout(() => {
            wheelTimeout = null;
        }, 800);

        if (e.deltaY > 0) {
            nextSlide();
        } else if (e.deltaY < 0) {
            prevSlide();
        }
    }, { passive: true });

    // --- EXPORT TO PDF ---
    const exportBtn = document.getElementById('exportBtn');
    const exportBtnLabel = document.getElementById('exportBtnLabel');

    function createSourcePageSlide(slideNum, sourceData) {
        const section = document.createElement('section');
        section.className = 'slide slide--source-page injected-source';
        section.dataset.injected = 'true';
        section.dataset.slide = `source-${slideNum}`;

        const glow = document.createElement('div');
        glow.className = 'slide__bg-glow slide__bg-glow--amber';
        section.appendChild(glow);

        const content = document.createElement('div');
        content.className = 'slide__content';

        const eyebrow = document.createElement('p');
        eyebrow.className = 'source-page__eyebrow';
        eyebrow.textContent = `📎 Fonte Original · Referência do Slide ${slideNum}`;
        content.appendChild(eyebrow);

        const title = document.createElement('h2');
        title.className = 'source-page__title';
        title.textContent = sourceData.title;
        content.appendChild(title);

        const body = document.createElement('div');
        body.className = 'source-page__body';

        sourceData.images.forEach(img => {
            const figure = document.createElement('figure');
            figure.className = 'source-page__figure';

            const image = document.createElement('img');
            image.src = img.src;
            image.alt = img.caption;
            figure.appendChild(image);

            const caption = document.createElement('figcaption');
            caption.textContent = img.caption;
            figure.appendChild(caption);

            body.appendChild(figure);
        });

        content.appendChild(body);
        section.appendChild(content);
        return section;
    }

    function injectSourceSlides() {
        const wrapper = document.getElementById('slidesWrapper');
        if (!wrapper) return;

        // Insert in REVERSE order so the DOM positions stay valid as we go
        const slideNumbers = Object.keys(slideSources).map(Number).sort((a, b) => b - a);

        slideNumbers.forEach(slideNum => {
            const sourceData = slideSources[slideNum];
            const targetSlide = document.querySelector(`.slide[data-slide="${slideNum}"]`);
            if (!targetSlide) return;

            const sourceSlide = createSourcePageSlide(slideNum, sourceData);
            targetSlide.parentNode.insertBefore(sourceSlide, targetSlide.nextSibling);
        });
    }

    function removeInjectedSlides() {
        document.querySelectorAll('.injected-source').forEach(el => el.remove());
    }

    function waitForInjectedImages() {
        const imgs = document.querySelectorAll('.injected-source img');
        const promises = Array.from(imgs).map(img => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise(resolve => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
            });
        });
        return Promise.all(promises);
    }

    async function exportToPdf() {
        if (exportBtn.dataset.loading === 'true') return;

        // Close modal if open
        if (modalOpen) closeSourceModal();

        exportBtn.dataset.loading = 'true';
        exportBtnLabel.textContent = 'Preparando...';

        try {
            injectSourceSlides();
            await waitForInjectedImages();
            // Small delay to let layout settle
            await new Promise(resolve => setTimeout(resolve, 150));

            exportBtnLabel.textContent = 'Abrindo impressão...';
            window.print();
        } catch (err) {
            console.error('Erro ao preparar PDF:', err);
            removeInjectedSlides();
        } finally {
            // Cleanup happens via afterprint; this is a fallback
            setTimeout(() => {
                if (exportBtn.dataset.loading === 'true') {
                    removeInjectedSlides();
                    exportBtn.dataset.loading = 'false';
                    exportBtnLabel.textContent = 'Exportar PDF';
                }
            }, 1500);
        }
    }

    window.addEventListener('afterprint', () => {
        removeInjectedSlides();
        exportBtn.dataset.loading = 'false';
        exportBtnLabel.textContent = 'Exportar PDF';
    });

    exportBtn.addEventListener('click', exportToPdf);

    // Ctrl/Cmd + P shortcut: prepare injected slides before native print dialog
    window.addEventListener('beforeprint', () => {
        if (!document.querySelector('.injected-source')) {
            injectSourceSlides();
        }
    });

    // --- INIT ---
    updateUI();

    const firstSlide = document.querySelector('.slide[data-slide="1"]');
    if (firstSlide) {
        firstSlide.classList.add('active');
    }
})();
