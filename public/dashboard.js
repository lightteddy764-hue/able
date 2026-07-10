// ===== Inject Background Blobs =====
(function() {
    const content = document.querySelector('.dashboard-content');
    if (content && !content.querySelector('.bg-blob')) {
        content.insertAdjacentHTML('afterbegin', '<div class="bg-blob blob-1"></div><div class="bg-blob blob-2"></div><div class="bg-blob blob-3"></div>');
    }
})();

// ===== Sidebar Toggle =====
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const mainContent = document.querySelector('.main-content');

if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        toggleOverlay();
    });
}

// ===== Overlay for Mobile Sidebar =====
function toggleOverlay() {
    let overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar.classList.contains('active')) {
        // Create overlay if not exists
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }
        overlay.classList.add('active');
        
        overlay.addEventListener('click', closeSidebar);
    } else {
        closeSidebar();
    }
}

function closeSidebar() {
    sidebar.classList.remove('active');
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

// ===== Close Sidebar on Window Resize =====
window.addEventListener('resize', () => {
    if (window.innerWidth > 968) {
        sidebar.classList.remove('active');
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) overlay.remove();
    }
});

// ===== Active Nav Item =====
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        // Don't set active for logout
        if (item.textContent.trim() === 'Logout') return;
        
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Close sidebar on mobile
        if (window.innerWidth <= 968) {
            closeSidebar();
        }
    });
});

// ===== Chart Filter Handler =====
const chartFilters = document.querySelectorAll('.chart-filter');
chartFilters.forEach(filter => {
    filter.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        animateChartChange(e.target.closest('.chart-card'));
    });
});

function animateChartChange(chartCard) {
    const chartPlaceholder = chartCard.querySelector('.chart-placeholder');
    chartPlaceholder.style.opacity = '0.5';
    chartPlaceholder.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        chartPlaceholder.style.opacity = '1';
        chartPlaceholder.style.transform = 'scale(1)';
    }, 300);
}

// ===== Stats Card Animation on Load =====
window.addEventListener('load', () => {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.4s ease-out';
            
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        }, index * 100);
    });
    
    // Animate stat values counting up
    animateStatValues();
});

// ===== Animate Stat Values =====
function animateStatValues() {
    const statValues = document.querySelectorAll('.stat-value');
    
    statValues.forEach(stat => {
        const text = stat.textContent.trim();
        const hasPercent = text.includes('%');
        const hasMin = text.includes('min');
        const numericValue = parseInt(text.replace(/[^0-9]/g, ''));
        
        if (!isNaN(numericValue)) {
            let current = 0;
            const increment = Math.ceil(numericValue / 30);
            const interval = setInterval(() => {
                current += increment;
                if (current >= numericValue) {
                    current = numericValue;
                    clearInterval(interval);
                }
                
                if (hasPercent) {
                    stat.textContent = current + '%';
                } else if (hasMin) {
                    stat.textContent = current + ' min';
                } else {
                    stat.textContent = current.toLocaleString();
                }
            }, 30);
        }
    });
}

// ===== Table Row Hover Effect =====
const tableRows = document.querySelectorAll('.data-table tbody tr');
tableRows.forEach(row => {
    row.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#F8F9FA';
        this.style.transition = 'background-color 0.2s ease';
    });
    
    row.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
    });
});

// ===== Icon Button Tooltips =====
const iconButtons = document.querySelectorAll('.btn-icon');
iconButtons.forEach(button => {
    button.addEventListener('mouseenter', function(e) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = 'View Details';
        tooltip.style.cssText = `
            position: absolute;
            background: #333;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
            white-space: nowrap;
            z-index: 1000;
            pointer-events: none;
            animation: tooltipFadeIn 0.2s ease-out;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes tooltipFadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        if (!document.querySelector('#tooltip-styles')) {
            style.id = 'tooltip-styles';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(tooltip);
        
        const rect = button.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        
        button._tooltip = tooltip;
    });
    
    button.addEventListener('mouseleave', function() {
        if (this._tooltip) {
            this._tooltip.remove();
            delete this._tooltip;
        }
    });
});

// ===== Notification Bell Animation =====
const notificationButton = document.querySelector('.icon-button');
if (notificationButton) {
    // Simulate new notification
    setTimeout(() => {
        notificationButton.style.animation = 'bellRing 0.5s ease-in-out';
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes bellRing {
                0%, 100% { transform: rotate(0); }
                10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
                20%, 40%, 60%, 80% { transform: rotate(10deg); }
            }
        `;
        if (!document.querySelector('#bell-animation-styles')) {
            style.id = 'bell-animation-styles';
            document.head.appendChild(style);
        }
    }, 2000);
}

// ===== Search Bar Enhancement =====
// Search is handled globally by sidebar-nav.js

// ===== User Profile Dropdown (Future Enhancement) =====
const userProfile = document.querySelector('.user-profile');
if (userProfile) {
    userProfile.addEventListener('click', () => {
        // Placeholder for dropdown menu
        console.log('User profile clicked');
    });
}

// ===== New Patient Button Handler =====
const newPatientBtn = document.querySelector('.page-header .btn-primary');
if (newPatientBtn) {
    // This button doesn't exist in wellness dashboard, remove this handler
    // newPatientBtn.addEventListener('click', () => {
    //     showNotification('Feature coming soon!', 'info');
    // });
}

// ===== Notification Function =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `dashboard-notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                ${type === 'error' ? 
                    '<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/><path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' :
                    '<path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
                }
            </svg>
            <span>${message}</span>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .dashboard-notification {
            position: fixed;
            top: 5rem;
            right: 2rem;
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        }
        
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100px);
            }
        }
        
        .dashboard-notification .notification-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .dashboard-notification svg {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
        }
        
        .notification-error {
            border-left: 4px solid #f44336;
        }
        
        .notification-error svg {
            color: #f44336;
        }
        
        .notification-info {
            border-left: 4px solid #DE7425;
        }
        
        .notification-info svg {
            color: #DE7425;
        }
        
        .dashboard-notification .notification-content span {
            color: #333;
            font-weight: 500;
        }
        
        @media (max-width: 768px) {
            .dashboard-notification {
                top: 4rem;
                right: 1rem;
                left: 1rem;
            }
        }
    `;

    if (!document.querySelector('#dashboard-notification-styles')) {
        style.id = 'dashboard-notification-styles';
        document.head.appendChild(style);
    }
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// ===== Check Authentication =====
window.addEventListener('load', () => {
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    const severityLevel = localStorage.getItem('severityLevel');
    
    // Update user profile if logged in
    if (userName) {
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
        
        // Update role to Wellness Seeker
        const userRoleElement = document.querySelector('.user-role');
        if (userRoleElement) {
            userRoleElement.textContent = 'Wellness Seeker';
        }
    }
    
    // Show welcome notification only on dashboard page
    if (userName && window.location.pathname.includes('dashboard')) {
        setTimeout(() => {
            const firstName = userName.split(' ')[0];
            if (severityLevel === 'severe') {
                showNotification(`Welcome, ${firstName}. We recommend connecting with a therapist in the Healing Zone.`, 'info');
            } else {
                showNotification(`Welcome back, ${firstName}! Ready to continue your wellness journey?`, 'info');
            }
        }, 500);
    }
});

// ===== Service Card Click Handlers =====
const serviceCards = document.querySelectorAll('.service-card');
serviceCards.forEach(card => {
    const exploreBtn = card.querySelector('.btn-service');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            const serviceName = card.querySelector('h3').textContent;
            showNotification(`${serviceName} coming soon! We're building amazing experiences for you.`, 'info');
        });
    }
});

// ===== Console Welcome Message =====
console.log('%cABLE Wellness Dashboard', 'color: #DE7425; font-size: 24px; font-weight: bold;');
console.log('%cA Better Life Enabled', 'color: #666; font-size: 14px;');
console.log('%c🌟 Your wellness journey starts here!', 'color: #4CAF50; font-size: 12px;');


// ===== Topbar User Profile — Load real user data across all pages =====
(function() {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/me', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(user => {
            // Update all user-profile images in topbar
            const avatar = user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || 'U') + '&background=E67E22&color=fff';
            document.querySelectorAll('.user-profile img').forEach(img => { img.src = avatar; });
            // Update name
            document.querySelectorAll('.user-name').forEach(el => { el.textContent = user.name || 'User'; });
            // Store for other scripts
            localStorage.setItem('userName', user.name || 'User');
        })
        .catch(() => {});
})();
