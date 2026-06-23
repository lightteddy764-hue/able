// Shared Sidebar Navigation for all user-facing pages
(function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const navItems = [
        { href: 'dashboard.html', label: 'Dashboard', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2"/><path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2"/>' },
        { href: 'self-care.html', label: 'Self-Care', icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" stroke-width="2"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
        { href: 'healing-zone.html', label: 'Healing Zone', icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2"/>' },
        { href: 'body-mind.html', label: 'Body-Mind', icon: '<path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
        { href: 'community.html', label: 'Community', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>' },
        { href: 'parenting.html', label: 'Parenting', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2"/>' },
        { href: 'child-support.html', label: 'Child Support', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>' },
        { href: 'youth-support.html', label: 'Youth Support', icon: '<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2"/>' },
        { href: 'my-voice.html', label: 'My Voice', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>' },
        { href: 'settings.html', label: 'Settings', icon: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51" stroke="currentColor" stroke-width="2"/>' }
    ];

    const navHTML = navItems.map(item =>
        `<a href="${item.href}" class="nav-item${currentPage === item.href ? ' active' : ''}"><svg viewBox="0 0 24 24" fill="none">${item.icon}</svg><span>${item.label}</span></a>`
    ).join('\n            ');

    const sidebarHTML = `
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header"><img src="images/logo.svg" alt="ABLE" class="sidebar-logo"></div>
        <nav class="sidebar-nav">
            ${navHTML}
        </nav>
        <div class="sidebar-footer"><a href="login.html" class="nav-item"><svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2"/><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Logout</span></a></div>
    </aside>`;

    const existing = document.getElementById('sidebar');
    if (existing) {
        existing.outerHTML = sidebarHTML;
    } else {
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    }
})();
