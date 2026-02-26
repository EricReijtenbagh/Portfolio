/* ===========================================
   Eric Reijtenbagh Portfolio - Main JavaScript
   JayGood Engine: Lenis + GSAP + Canvas
   =========================================== */

// ===================================
// PRELOADER
// ===================================
const preloaderStatuses = [
    "INITIALIZING KERNEL...",
    "LOADING ASSETS...",
    "OPTIMIZING WEBGL...",
    "ESTABLISHING SECURE CONNECTION...",
    "RENDERING VIEWPORT...",
    "SYSTEM READY"
];

let preloaderProgress = 0;

function initPreloader() {
    const preloader = document.getElementById('preloader');
    const percentEl = document.getElementById('preloader-percent');
    const statusEl = document.getElementById('preloader-status');
    const barEl = document.getElementById('preloader-bar');

    if (!preloader) return;

    const maxDuration = 2000;
    const tickInterval = 80;
    const totalTicks = maxDuration / tickInterval;
    const incrementPerTick = Math.ceil(100 / totalTicks);

    const interval = setInterval(() => {
        preloaderProgress += incrementPerTick + Math.floor(Math.random() * 3);
        if (preloaderProgress >= 100) {
            preloaderProgress = 100;
            clearInterval(interval);

            setTimeout(() => {
                preloader.classList.add('loaded');
                document.body.style.overflow = '';

                setTimeout(() => {
                    preloader.style.display = 'none';
                    initLenis();
                    initHeroCanvas();
                    initHorizontalScroll();
                    initCustomCursor();
                    initMobileMenu();
                    initScrollAnimations();
                }, 800);
            }, 300);
        }

        if (percentEl) percentEl.textContent = preloaderProgress + '%';
        if (barEl) barEl.style.width = preloaderProgress + '%';

        const statusIndex = Math.min(
            Math.floor(preloaderProgress / 100 * preloaderStatuses.length),
            preloaderStatuses.length - 1
        );
        if (statusEl) statusEl.textContent = '> ' + preloaderStatuses[statusIndex];
    }, tickInterval);
}

// ===================================
// LENIS SMOOTH SCROLL
// ===================================
let lenis;

function initLenis() {
    if (typeof Lenis === 'undefined') return;

    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
    });

    if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
    }

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
}

// ===================================
// CUSTOM CURSOR
// ===================================
function initCustomCursor() {
    const cursor = document.getElementById('cursor');
    const cursorTrail = document.getElementById('cursor-trail');
    const cursorText = cursor ? cursor.querySelector('.cursor-label') : null;

    if (!cursor || !cursorTrail) return;

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let trailX = 0, trailY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    window.addEventListener('mouseover', (e) => {
        const target = e.target;
        const interactive = target.closest('a, button, input, textarea, .cursor-interactive, [onclick]');
        const project = target.closest('[data-cursor="project"]');
        const drag = target.closest('[data-cursor="drag"]');
        const mailto = target.closest('[href^="mailto:"]');

        let label = 'VIEW';
        if (project) label = 'VIEW';
        else if (drag) label = 'DRAG';
        else if (mailto) label = 'SEND';

        if (cursorText) cursorText.textContent = label;

        if (interactive) {
            cursor.classList.add('is-hovering');
            cursorTrail.classList.add('is-hovering');
        } else {
            cursor.classList.remove('is-hovering');
            cursorTrail.classList.remove('is-hovering');
        }
    });

    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.25;
        cursorY += (mouseY - cursorY) * 0.25;
        trailX += (mouseX - trailX) * 0.12;
        trailY += (mouseY - trailY) * 0.12;

        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
        cursorTrail.style.transform = `translate3d(${trailX}px, ${trailY}px, 0)`;

        requestAnimationFrame(animateCursor);
    }

    animateCursor();
}

// ===================================
// HERO CANVAS - Guitar Strings
// ===================================
function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width, height;
    const numStrings = 15;
    const damping = 0.9;
    const interactionRadius = 100;

    const mouse = { x: -1000, y: -1000, vx: 0, vy: 0, prevX: 0, prevY: 0 };

    class GuitarString {
        constructor(x) {
            this.x = x;
            this.active = 0;
            const numPoints = 10;
            this.points = [];
            for (let i = 0; i <= numPoints; i++) {
                this.points.push({ x: x, y: (height / numPoints) * i, vx: 0, vy: 0, baseX: x });
            }
        }

        update() {
            let hasMotion = false;
            this.points.forEach((point, i) => {
                if (i === 0 || i === this.points.length - 1) return;
                const dx = point.x - point.baseX;
                const springForce = -0.05 * dx;
                point.vx += springForce;
                point.vx *= damping;
                point.x += point.vx;

                if (Math.abs(mouse.y - point.y) < interactionRadius &&
                    Math.abs(mouse.x - point.x) < interactionRadius) {
                    const distX = mouse.x - point.x;
                    const influence = Math.max(0, (interactionRadius - Math.abs(distX)) / interactionRadius);
                    if (Math.abs(mouse.vx) > 5) {
                        point.vx += mouse.vx * influence * 0.1;
                        this.active = 1;
                    }
                }
                if (Math.abs(point.vx) > 0.01 || Math.abs(dx) > 0.1) hasMotion = true;
            });
            this.active *= 0.95;
            return hasMotion || this.active > 0.01;
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 0; i < this.points.length - 1; i++) {
                const p1 = this.points[i];
                const p2 = this.points[i + 1];
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                if (i === 0) ctx.lineTo(midX, midY);
                else ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
            }
            const lastPoint = this.points[this.points.length - 1];
            ctx.lineTo(lastPoint.x, lastPoint.y);

            const r = Math.floor(20 + (-20) * this.active);
            const g = Math.floor(20 + 171 * this.active);
            const b = Math.floor(20 + 235 * this.active);
            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineWidth = 1 + this.active * 1.5;
            ctx.stroke();
        }
    }

    let strings = [];

    function resize() {
        const container = canvas.parentElement;
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        strings = [];
        const spacing = width / (numStrings + 1);
        for (let i = 1; i <= numStrings; i++) {
            strings.push(new GuitarString(i * spacing));
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        mouse.vx = mouse.x - mouse.prevX;
        mouse.vy = mouse.y - mouse.prevY;
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        strings.forEach(s => { s.update(); s.draw(ctx); });
        requestAnimationFrame(animate);
    }

    function onMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    resize();
    animate();
}

// ===================================
// HORIZONTAL SCROLL SECTION
// ===================================
function initHorizontalScroll() {
    const section = document.getElementById('horizontal-scroll-section');
    const track = document.getElementById('horizontal-track');
    const progressBar = document.getElementById('scroll-progress');

    if (!section || !track || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || window.innerWidth < 768) return;

    const getScrollAmount = () => -(track.scrollWidth - window.innerWidth + 50);

    gsap.to(track, {
        x: getScrollAmount,
        ease: 'none',
        scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                if (progressBar) progressBar.style.width = (self.progress * 100) + '%';
            }
        }
    });
}

// ===================================
// MOBILE MENU
// ===================================
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!menuBtn || !mobileMenu) return;

    let isOpen = false;

    menuBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            mobileMenu.classList.add('is-open');
            menuBtn.classList.add('is-open');
            if (lenis) lenis.stop();
        } else {
            mobileMenu.classList.remove('is-open');
            menuBtn.classList.remove('is-open');
            if (lenis) lenis.start();
        }
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            isOpen = false;
            mobileMenu.classList.remove('is-open');
            menuBtn.classList.remove('is-open');
            if (lenis) lenis.start();
        });
    });
}

// ===================================
// SCROLL ANIMATIONS (GSAP)
// ===================================
function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.utils.toArray('.animate-fade-in-up').forEach(el => {
        gsap.from(el, {
            y: 40,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    gsap.utils.toArray('.sticky').forEach(card => {
        gsap.to(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
    });
}

// ===================================
// CUSTOM SCROLLBAR
// ===================================
function initCustomScrollbar() {
    const scrollbar = document.createElement('div');
    scrollbar.className = 'custom-scrollbar';
    scrollbar.innerHTML = '<div class="custom-scrollbar-thumb"></div>';
    document.body.appendChild(scrollbar);

    const thumb = scrollbar.querySelector('.custom-scrollbar-thumb');
    let isDragging = false;
    let startY = 0;
    let startScroll = 0;

    function updateThumb() {
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 50);
        const maxScroll = scrollHeight - clientHeight;
        const scrollTop = window.scrollY || (lenis ? lenis.scroll : 0);
        const thumbTop = (scrollTop / maxScroll) * (clientHeight - thumbHeight);
        thumb.style.height = thumbHeight + 'px';
        thumb.style.transform = `translateY(${thumbTop}px)`;
    }

    if (lenis) lenis.on('scroll', updateThumb);
    else window.addEventListener('scroll', updateThumb);

    thumb.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startScroll = lenis ? lenis.scroll : window.scrollY;
        thumb.classList.add('is-dragging');
        document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaY = e.clientY - startY;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 50);
        const scrollRatio = deltaY / (clientHeight - thumbHeight);
        const maxScroll = scrollHeight - clientHeight;
        const newScroll = startScroll + scrollRatio * maxScroll;
        if (lenis) lenis.scrollTo(newScroll, { immediate: true });
        else window.scrollTo(0, newScroll);
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            thumb.classList.remove('is-dragging');
            document.body.style.userSelect = '';
        }
    });

    updateThumb();
    window.addEventListener('resize', updateThumb);
}

// ===================================
// MODAL FUNCTIONS
// ===================================
function openModal(projectId) {
    const modal = document.getElementById('modal-' + projectId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
    }
}

function closeModal(projectId) {
    const modal = document.getElementById('modal-' + projectId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (lenis) lenis.start();
    }
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
        if (lenis) lenis.start();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
        if (lenis) lenis.start();
    }
});

// ===================================
// ACTIVE NAV LINK
// ===================================
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        link.setAttribute('data-text', link.textContent);
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('is-active');
        }
    });
}

// ===================================
// INITIALIZE
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    const hasPreloader = document.getElementById('preloader');
    if (hasPreloader) document.body.style.overflow = 'hidden';

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    if (hasPreloader) {
        initPreloader();
    } else {
        initLenis();
        initHeroCanvas();
        initHorizontalScroll();
        initCustomCursor();
        initMobileMenu();
        initScrollAnimations();
    }

    setActiveNavLink();
    setTimeout(initCustomScrollbar, 1500);
});
