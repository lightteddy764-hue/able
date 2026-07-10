// Shared Admin Navigation - Include on all admin pages
(function() {
    const currentPage = window.location.pathname;

    function isActive(href) {
        if (href === '/admin/dashboard.html' && currentPage === '/admin/dashboard.html' && !window.location.hash) return true;
        if (href !== '/admin/dashboard.html' && currentPage.includes(href.replace('/admin/', ''))) return true;
        return false;
    }

    const navItems = [
        // Overview
        { href: '/admin/dashboard.html', label: 'Dashboard', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2"/><path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2"/>' },
        { href: '/admin/analytics.html', label: 'Analytics', icon: '<path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },

        // People
        { href: '/admin/users.html', label: 'Users', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>' },
        { href: '/admin/therapists.html', label: 'Therapists', icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2"/>' },
        { href: '/admin/professionals.html', label: 'Professionals', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },

        // Content pages (CMS)
        { href: '/admin/landing.html', label: 'Landing Page', icon: '<path d="M3 3h18v18H3V3z" stroke="currentColor" stroke-width="2"/><path d="M3 9h18" stroke="currentColor" stroke-width="2"/><path d="M9 9v12" stroke="currentColor" stroke-width="2"/>' },
        { href: '/admin/community-page.html', label: 'Community Page', icon: '<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><path d="M3 9h18M9 21V9" stroke="currentColor" stroke-width="2"/>' },
        { href: '/admin/youth-support.html', label: 'Youth Support', icon: '<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" stroke-width="2"/><path d="M4 21h16" stroke="currentColor" stroke-width="2"/>' },
        { href: '/admin/stories.html', label: 'Stories', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>' },
        { href: '/admin/settings.html', label: 'Settings Page', icon: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09" stroke="currentColor" stroke-width="2"/>' },

        // Operations
        { href: '/admin/professional-sessions.html', label: 'Pro Sessions', icon: '<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
        { href: '/admin/marketplace.html', label: 'Marketplace', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2"/><path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7" r="2" stroke="currentColor" stroke-width="1.5"/>' },
        { href: '/admin/music.html', label: 'Music', icon: '<path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="2"/>' }
    ];

    const navHTML = navItems.map(item => 
        `<a href="${item.href}"${isActive(item.href) ? ' class="active"' : ''}><svg viewBox="0 0 24 24" fill="none">${item.icon}</svg>${item.label}</a>`
    ).join('\n            ');

    const sidebarHTML = `
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header"><img src="/images/logo.svg" alt="ABLE"><span>Admin Panel</span></div>
        <nav class="sidebar-nav">
            ${navHTML}
        </nav>
        <div class="sidebar-footer">
            <a href="#" onclick="localStorage.removeItem('adminToken');window.location.href='/admin/'"><svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2"/><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Logout</a>
        </div>
    </aside>`;

    // Replace existing sidebar or insert at start of body
    const existingSidebar = document.getElementById('sidebar');
    if (existingSidebar) {
        existingSidebar.outerHTML = sidebarHTML;
    } else {
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    }
})();
