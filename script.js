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
    const slideSources = {
        3:  { title: 'Custos Meta Ads · CPC/CPM (2020 = 100)', images: [
                { src: 'grafico-slide-3.png', caption: 'Crescimento relativo dos custos Meta Ads — CPC/CPM globais e Brasil efetivo (2020–2026).' }
            ]},
        4:  { title: 'Anunciantes, Verba em Mídia e Atenção (2019–2023)', images: [
                { src: 'graficos-slide-4.png', caption: 'Crescimento de anunciantes e verba versus atenção disponível estagnada.' }
            ]},
        9:  { title: 'Arquitetura Andrômeda · Meta', images: [
                { src: 'graficos-slide-9.png', caption: 'Hierarchical Ad Index + Model · Meta MTIA + NVIDIA Grace Hopper Platform.' }
            ]},
        14: { title: 'Mais de 50% atribuídos ao criativo · Meta', images: [
                { src: 'grafico-slide-pilar1.png', caption: 'Print original com o dado divulgado pela Meta sobre o peso do criativo nos resultados de leilão.' }
            ]},
        16: { title: 'Os 5 gargalos criativos das marcas', images: [
                { src: 'grafico-slide-o-gargalo-escondido-das-marcas.png', caption: 'Lack of Repertoire, Low Production Frequency, No Testing, Little Variety of Format, No Learning Method.' }
            ]},
        19: { title: 'Volume criativo acumulado · semanal', images: [
                { src: 'grafico-slide-frequencia-a-cadencia-minima.png', caption: 'Repertório criativo crescendo de forma composta semana a semana.' }
            ]},
        22: { title: 'Qualidade dos eventos · Gerenciador da Meta', images: [
                { src: 'graficoslide-pilar2-v2.png', caption: 'Tabela de eventos (PageView 7.6 · Iniciar checkout 6.1 · Compra 9.3 · Purchase Attempt 9.3).' },
                { src: 'grafico-slide-pilar2.png', caption: 'Detalhe do evento Compra com pontuação 9.3/10 de qualidade da correspondência.' }
            ]},
        23: { title: 'Framework de Campanha · Teste · Pré-escala · Escala', images: [
                { src: 'grafico-slide-framework-campanha.png', caption: 'Funil 100% → 30% → 10% de validação criativa.' }
            ]}
    };

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

    // --- INIT ---
    updateUI();

    const firstSlide = document.querySelector('.slide[data-slide="1"]');
    if (firstSlide) {
        firstSlide.classList.add('active');
    }
})();
