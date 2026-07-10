// Shared Sidebar + Topbar for all user-facing pages
(function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Pages that don't require login
    const publicPages = ['index.html', 'login.html', 'signup.html', 'story.html', 'professional-profile.html', ''];

    // Auth guard — redirect to login if no token (skip public pages)
    if (!publicPages.includes(currentPage)) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPage) + '&msg=login_required';
            return; // Stop executing rest of sidebar script
        }
    }

    // Logically grouped navigation
    const navItems = [
        // Home
        { href: 'dashboard.html', label: 'Dashboard', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2"/><path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2"/>' },

        // Wellness services
        { href: 'healing-zone.html', label: 'Healing Zone', icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2"/>' },
        { href: 'body-mind.html', label: 'Body-Mind', icon: '<path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
        { href: 'self-care.html', label: 'Self-Care', icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" stroke-width="2"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },

        // Social
        { href: 'community.html', label: 'Community', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>' },
        { href: 'my-voice.html', label: 'My Voice', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>' },
        { href: 'marketplace.html', label: 'Marketplace', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="13" r="3" stroke="currentColor" stroke-width="2"/>' },
        { href: 'playground.html', label: 'Playground', icon: '<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" fill="none"/>' },
        { href: 'music.html', label: 'Music', icon: '<path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="2"/>' },

        // Family & youth
        { href: 'youth-support.html', label: 'Youth Support', icon: '<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2"/>' },
        { href: 'parenting.html', label: 'Parenting', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2"/>' },
        { href: 'child-support.html', label: 'Child Support', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>' },

        // Account
        { href: 'settings.html', label: 'Settings', icon: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51" stroke="currentColor" stroke-width="2"/>' }
    ];

    const navHTML = navItems.map(item =>
        `<a href="${item.href}" class="nav-item${currentPage === item.href ? ' active' : ''}"><svg viewBox="0 0 24 24" fill="none">${item.icon}</svg><span>${item.label}</span></a>`
    ).join('\n            ');

    const sidebarHTML = `
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header"><img src="/images/logo.svg" alt="ABLE" class="sidebar-logo"></div>
        <nav class="sidebar-nav">
            ${navHTML}
        </nav>
        <div class="sidebar-footer"><a href="#" class="nav-item" onclick="localStorage.removeItem('token');window.location.href='login.html'"><svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2"/><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Logout</span></a></div>
    </aside>`;

    const existing = document.getElementById('sidebar');
    if (existing) {
        existing.outerHTML = sidebarHTML;
    } else {
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    }

    // ===== SHARED TOPBAR =====
    // Populate user profile in existing topbar
    const existingTopbar = document.querySelector('.topbar');
    if (existingTopbar) {
        injectUserProfile(existingTopbar);
    }

    function injectUserProfile(topbar) {
        const token = localStorage.getItem('token');
        if (!token) return;
        const nameEl = topbar.querySelector('.user-name') || topbar.querySelector('#dashUserName');
        const imgEl = topbar.querySelector('.user-profile img');
        // Fetch user info
        fetch('/api/me', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(r => r.json())
            .then(u => {
                if (u.name && nameEl) nameEl.textContent = u.name;
                if (imgEl) {
                    const src = u.avatar || u.profilePhoto || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name || 'User') + '&background=E67E22&color=fff');
                    imgEl.src = src;
                    imgEl.onerror = function() { this.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name || 'User') + '&background=E67E22&color=fff'; };
                }
            })
            .catch(() => {});
    }

    // Menu toggle
    document.addEventListener('click', function(e) {
        if (e.target.closest('#menuToggle') || e.target.closest('.menu-toggle')) {
            var sb = document.getElementById('sidebar');
            if (sb) sb.classList.toggle('open');
        }
    });

    // ===== GLOBAL SEARCH (works on all pages) =====
    const searchData = [
        { title: 'Dashboard', desc: 'Your wellness home', url: 'dashboard.html', tags: 'home overview stats mood' },
        { title: 'Healing Zone', desc: 'Find therapists & book sessions', url: 'healing-zone.html', tags: 'therapist session book counselor professional' },
        { title: 'Body-Mind', desc: 'Yoga, nutrition, breathing', url: 'body-mind.html', tags: 'yoga breathing nutrition exercise meditation body mind' },
        { title: 'Self-Care', desc: 'Daily check-ins & wellness tools', url: 'self-care.html', tags: 'checkin mood tools routine journal selfcare' },
        { title: 'Community', desc: 'Circles, groups, events', url: 'community.html', tags: 'circle group event discussion social community' },
        { title: 'My Voice', desc: 'Share & read stories', url: 'my-voice.html', tags: 'story write share blog voice' },
        { title: 'Marketplace', desc: 'Wellness services near you', url: 'marketplace.html', tags: 'spa clinic yoga studio store service vendor marketplace' },
        { title: 'Playground', desc: 'Creative AI activities', url: 'playground.html', tags: 'poem dream imagination song film creative ai playground' },
        { title: 'Music', desc: 'Meditation, sleep, focus & healing music', url: 'music.html', tags: 'music song meditation sleep focus relax healing sound' },
        { title: 'Youth Support', desc: 'Career, confidence, wellness for youth', url: 'youth-support.html', tags: 'youth career confidence teen assessment young' },
        { title: 'Parenting', desc: 'Parenting challenges & scripts', url: 'parenting.html', tags: 'parent child family challenge parenting' },
        { title: 'Child Support', desc: 'Support guides for children', url: 'child-support.html', tags: 'child kid anxiety bullying school support' },
        { title: 'Settings', desc: 'Account, profile, privacy', url: 'settings.html', tags: 'account profile password avatar export delete settings' },
        { title: 'Book Therapist', desc: 'Request a therapy session', url: 'healing-zone.html', tags: 'book appointment therapist session healing' },
        { title: 'AI Chatbot', desc: 'Talk to ABLE wellness assistant', url: 'dashboard.html', tags: 'chat ai bot assistant talk help mira' },
        { title: 'Breathing Exercise', desc: '4-7-8, box breathing & more', url: 'body-mind.html', tags: 'breathing calm relax anxiety 478 box breath' },
        { title: 'Write a Poem', desc: 'Creative expression in Playground', url: 'playground.html', tags: 'poem write creative expression art' },
        { title: 'Dream Analysis', desc: 'AI interprets your dreams', url: 'playground.html', tags: 'dream sleep analysis interpretation night' },
        { title: 'Yoga Sessions', desc: 'Morning & evening yoga flows', url: 'body-mind.html', tags: 'yoga stretch flow morning evening' },
    ];

    // Wait for DOM to be ready before attaching search (script loads before topbar HTML)
    document.addEventListener('DOMContentLoaded', function() {
        var searchInput = document.querySelector('.search-bar input');
        if (!searchInput) return;
        var searchBar = searchInput.closest('.search-bar');

        // Create dropdown attached to search bar
        var dropdown = document.createElement('div');
        dropdown.id = 'gsDropdown';
        dropdown.style.cssText = 'position:absolute;top:calc(100% + 6px);left:0;right:0;background:white;border:1.5px solid #E5E7EB;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,0.12);max-height:360px;overflow-y:auto;z-index:99999;display:none;scrollbar-width:none';
        searchBar.style.position = 'relative';
        searchBar.appendChild(dropdown);

        function showResults(q) {
            if (q.length < 2) { dropdown.style.display = 'none'; return; }
            var results = searchData.filter(function(item) {
                return item.title.toLowerCase().indexOf(q) > -1 || item.desc.toLowerCase().indexOf(q) > -1 || item.tags.indexOf(q) > -1;
            }).slice(0, 6);

            var html = '';
            if (results.length) {
                html = results.map(function(r) {
                    return '<a href="' + r.url + '" style="display:flex;align-items:center;gap:0.75rem;padding:0.7rem 1rem;text-decoration:none;border-bottom:1px solid #F9FAFB;transition:background 0.1s" onmouseover="this.style.background=\'#FEF3E2\'" onmouseout="this.style.background=\'white\'"><div style="width:32px;height:32px;background:#FEF3E2;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.8rem;flex-shrink:0">🔍</div><div><strong style="font-size:0.84rem;color:#111827;display:block">' + r.title + '</strong><span style="font-size:0.72rem;color:#6B7280">' + r.desc + '</span></div></a>';
                }).join('');
            } else {
                html = '<div style="padding:1.25rem;text-align:center"><p style="font-size:0.84rem;color:#6B7280;margin-bottom:0.5rem">No results for "' + q + '"</p><p style="font-size:0.75rem;color:#9CA3AF">Try: <a href="healing-zone.html" style="color:#E67E22;text-decoration:none">therapists</a> · <a href="body-mind.html" style="color:#E67E22;text-decoration:none">yoga</a> · <a href="community.html" style="color:#E67E22;text-decoration:none">community</a> · <a href="playground.html" style="color:#E67E22;text-decoration:none">playground</a></p></div>';
            }
            dropdown.innerHTML = html;
            dropdown.style.display = 'block';
        }

        searchInput.addEventListener('input', function() { showResults(this.value.trim().toLowerCase()); });
        searchInput.addEventListener('focus', function() { if (this.value.trim().length >= 2) showResults(this.value.trim().toLowerCase()); });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-bar')) dropdown.style.display = 'none';
        });

        document.addEventListener('keydown', function(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchInput.focus(); searchInput.select(); }
            if (e.key === 'Escape') { dropdown.style.display = 'none'; searchInput.blur(); }
        });
    });
})();
