// ABLE Professional Portal — Shared Sidebar Navigation
(function() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    const navItems = [
        { href: '/professional/dashboard.html',   label: 'Dashboard',     icon: '📊' },
        { href: '/professional/requests.html',    label: 'Requests',      icon: '📋', badge: 'navPendingCount' },
        { href: '/professional/sessions.html',    label: 'Sessions',      icon: '📅' },
        { href: '/professional/posts.html',       label: 'Posts & Tips',  icon: '✍️' },
        { href: '/professional/profile.html',     label: 'My Profile',    icon: '👤' },
        { href: '/professional/availability.html',label: 'Availability',  icon: '🕐' },
        { href: '/professional/settings.html',    label: 'Settings',      icon: '⚙️' }
    ];

    const navHTML = navItems.map(item => {
        const isActive = item.href.endsWith(currentPage);
        const badgeHtml = item.badge
            ? `<span class="portal-pending-badge" id="${item.badge}" style="display:none">0</span>`
            : '';
        return `<a href="${item.href}" class="portal-nav-item${isActive ? ' active' : ''}">${item.icon} ${item.label}${badgeHtml}</a>`;
    }).join('\n');

    const sidebarHTML = `
    <aside class="portal-sidebar" id="portalSidebar">
        <div class="portal-sidebar-header">
            <img src="/images/logo.svg" alt="ABLE">
            <span class="portal-badge">PRO</span>
        </div>
        <nav class="portal-nav">
            ${navHTML}
        </nav>
        <div class="portal-sidebar-footer">
            <a href="#" id="portalLogout">🚪 Logout</a>
        </div>
    </aside>`;

    const existing = document.getElementById('portalSidebar');
    if (existing) {
        existing.outerHTML = sidebarHTML;
    } else {
        const layout = document.querySelector('.portal-layout');
        if (layout) layout.insertAdjacentHTML('afterbegin', sidebarHTML);
    }

    // Logout handler
    document.addEventListener('click', e => {
        if (e.target.id === 'portalLogout' || e.target.closest('#portalLogout')) {
            e.preventDefault();
            localStorage.removeItem('professionalToken');
            localStorage.removeItem('professionalName');
            window.location.href = '/professional/login.html';
        }
    });

    // Load pending badge count
    const token = localStorage.getItem('professionalToken');
    if (token) {
        fetch('/professional/api/requests', {
            headers: { 'Authorization': 'Bearer ' + token }
        }).then(r => r.ok ? r.json() : null).then(data => {
            if (!data) return;
            const count = (data.requests || []).length;
            const badge = document.getElementById('navPendingCount');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        }).catch(() => {});
    }
})();
