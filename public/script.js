/* ============================================================
   ABLE Landing Page Scripts
   - Mobile menu toggle
   - Smooth scroll for in-page anchors
   - Ripple effect on primary/outline buttons
   - Helper: animated counter, debounce
   Note: navbar .scrolled toggle and reveal IntersectionObserver
   live in the inline <script> at the bottom of index.html.
   ============================================================ */

// ----- Mobile Menu Toggle -----
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileOverlay = document.getElementById('mobileOverlay');
const mobileClose = document.getElementById('mobileClose');

function openMobileMenu() {
    if (mobileMenu) mobileMenu.classList.add('active');
    if (mobileOverlay) mobileOverlay.classList.add('active');
    if (hamburger) hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    if (mobileMenu) mobileMenu.classList.remove('active');
    if (mobileOverlay) mobileOverlay.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');
    document.body.style.overflow = '';
}

if (hamburger) hamburger.addEventListener('click', openMobileMenu);
if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);
if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

document.querySelectorAll('.mobile-menu-links a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});

// ----- Smooth scroll for anchor links -----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 70;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    });
});

// ----- Ripple effect on primary action buttons -----
document.querySelectorAll('.btn-primary-lg, .btn-outline-lg, .nav-cta, .mobile-btn-signup').forEach(button => {
    button.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position:absolute; width:${size}px; height:${size}px; border-radius:50%;
            background:rgba(255,255,255,0.4);
            left:${e.clientX - rect.left - size / 2}px;
            top:${e.clientY - rect.top - size / 2}px;
            transform:scale(0); animation:ripple 0.6s ease-out; pointer-events:none;
        `;
        const prevPos = getComputedStyle(this).position;
        if (prevPos === 'static') this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
});

const rippleStyle = document.createElement('style');
rippleStyle.textContent = `@keyframes ripple { to { transform:scale(4); opacity:0; } }`;
document.head.appendChild(rippleStyle);

// ----- Helpers (exported on window for reuse) -----
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

window.AbleHelpers = { animateCounter, debounce };

// ----- Safety net: ensure reveal cards never stay invisible -----
// If the IntersectionObserver in the inline script fails for any reason,
// reveal everything after 1.5s as a fallback.
window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelectorAll(
            '.feature-card, .step-card, .testimonial-card, .pricing-card, .therapist-showcase, .stat-block'
        ).forEach(el => {
            if (!el.classList.contains('revealed')) el.classList.add('revealed');
        });
    }, 1500);
});

console.log('ABLE landing page initialized.');
