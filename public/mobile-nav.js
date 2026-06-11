// Shared Mobile Bottom Nav - Auto-injects on all logged-in user pages
(function() {
    // Don't inject if user not logged in
    const token = localStorage.getItem('token');
    if (!token) return;

    // Don't inject on landing/auth pages
    const path = window.location.pathname;
    const skipPages = ['/', '/index.html', '/login.html', '/signup.html'];
    if (skipPages.includes(path)) return;

    // Don't inject if already exists
    if (document.querySelector('.dp-mobile-nav')) return;

    // Determine current page for active state
    const currentPage = path.split('/').pop() || 'dashboard.html';

    const navItems = [
        { href: 'dashboard.html', label: 'Home', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2"/><path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2"/>' },
        { href: 'healing-zone.html', label: 'Healing', icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2"/>' },
        { href: 'body-mind.html', label: 'Wellness', icon: '<path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
        { href: 'community.html', label: 'Community', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>' },
        { href: 'my-voice.html', label: 'Voice', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>' }
    ];

    const navHTML = '<nav class="dp-mobile-nav">' + navItems.map(item => {
        const isActive = currentPage === item.href || (item.href === 'dashboard.html' && currentPage === '');
        return `<a href="${item.href}" class="dp-mn-item${isActive ? ' active' : ''}"><svg viewBox="0 0 24 24" fill="none">${item.icon}</svg><span>${item.label}</span></a>`;
    }).join('') + '</nav>';

    document.body.insertAdjacentHTML('beforeend', navHTML);

    // Inject base styles in case the page doesn't include dash-premium.css
    if (!document.querySelector('style[data-mobile-nav-styles]')) {
        const styles = document.createElement('style');
        styles.setAttribute('data-mobile-nav-styles', 'true');
        styles.textContent = `
            .dp-mobile-nav { display:none; position:fixed; bottom:0; left:0; right:0; background:white; border-top:1px solid #E5E7EB; padding:0.5rem 0; z-index:1000; justify-content:space-around; box-shadow:0 -2px 12px rgba(0,0,0,0.05); }
            .dp-mn-item { display:flex; flex-direction:column; align-items:center; gap:0.2rem; text-decoration:none; color:#6B7280; font-size:0.65rem; padding:0.4rem 0.5rem; transition:color 0.2s; flex:1; }
            .dp-mn-item svg { width:22px; height:22px; }
            .dp-mn-item.active { color:#E67E22; }
            .dp-mn-item.active svg { stroke:#E67E22; }
            @media (max-width: 768px) {
                .dp-mobile-nav { display:flex; }
                body { padding-bottom: 70px !important; }
                .chatbot-button { bottom: 80px !important; }
            }
        `;
        document.head.appendChild(styles);
    }
})();
