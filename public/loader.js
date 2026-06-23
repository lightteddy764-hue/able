// ===== Page Loader — 3 second minimum, smooth reveal =====
(function() {
    document.body.classList.add('loading');

    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.id = 'pageLoader';
    loader.innerHTML = `
        <div class="loader-dots">
            <span></span><span></span><span></span>
        </div>
    `;
    document.body.prepend(loader);

    function hideLoader() {
        const loaderEl = document.getElementById('pageLoader');
        if (!loaderEl || loaderEl.classList.contains('hidden')) return;
        loaderEl.classList.add('hidden');
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
        setTimeout(() => loaderEl.remove(), 700);
    }

    // Minimum 1.6 seconds display
    const minTime = 1600;
    const startTime = Date.now();

    function tryHide() {
        const elapsed = Date.now() - startTime;
        if (elapsed >= minTime) {
            hideLoader();
        } else {
            setTimeout(hideLoader, minTime - elapsed);
        }
    }

    if (document.readyState === 'complete') {
        tryHide();
    } else {
        window.addEventListener('load', tryHide);
    }

    // Absolute max: 6 seconds
    setTimeout(hideLoader, 6000);

    window.hidePageLoader = hideLoader;
})();
