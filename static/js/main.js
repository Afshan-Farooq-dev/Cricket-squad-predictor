/* =============================================
   Cricket Squad Selector — Main JS
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

    // --- 1. Auto-dismiss flash messages after 4s ---
    setTimeout(function () {
        document.querySelectorAll('#flash-container .alert').forEach(function (alert) {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
            if (bsAlert) bsAlert.close();
        });
    }, 4000);

    // --- 2. Loading spinner on form submit ---
    document.querySelectorAll('form').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            // Use setTimeout to allow other 'submit' listeners (like validation)
            // to run first and potentially call e.preventDefault()
            setTimeout(function() {
                if (!e.defaultPrevented) {
                    const overlay = document.getElementById('loadingOverlay');
                    if (overlay) overlay.style.display = 'flex';
                }
            }, 0);
        });
    });

    // Hide overlay on page load (in case of back navigation)
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';

    // --- 3. Counter animation (IntersectionObserver) ---
    const counters = document.querySelectorAll('.stat-number[data-target]');
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseFloat(el.getAttribute('data-target'));
                const isFloat = String(target).includes('.');
                let start = 0;
                const duration = 1500;
                const startTime = performance.now();

                function update(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const current = start + (target - start) * eased;
                    el.textContent = isFloat ? current.toFixed(1) : Math.floor(current);
                    if (progress < 1) requestAnimationFrame(update);
                    else el.textContent = isFloat ? target.toFixed(1) : target;
                }

                requestAnimationFrame(update);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.4 });

    counters.forEach(function (counter) {
        observer.observe(counter);
    });

    // --- 4. Live search filter on player list ---
    const searchInput = document.getElementById('liveSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const query = this.value.toLowerCase().trim();
            document.querySelectorAll('.player-card-wrapper').forEach(function (card) {
                const name = card.getAttribute('data-name') || '';
                card.style.display = name.toLowerCase().includes(query) ? '' : 'none';
            });
        });
    }

    // --- 5. Password strength checker ---
    const pwdInput = document.getElementById('password');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    if (pwdInput && strengthBar) {
        pwdInput.addEventListener('input', function () {
            const val = this.value;
            let strength = 0;
            if (val.length > 5) strength++;
            if (val.length > 9) strength++;
            if (/[A-Z]/.test(val)) strength++;
            if (/[0-9]/.test(val)) strength++;
            if (/[^A-Za-z0-9]/.test(val)) strength++;

            if (val.length === 0) {
                strengthBar.style.width = '0%';
                strengthBar.style.background = '';
                if (strengthText) strengthText.textContent = '';
            } else if (strength <= 2) {
                strengthBar.style.width = '33%';
                strengthBar.style.background = '#dc3545';
                if (strengthText) { strengthText.textContent = 'Weak'; strengthText.style.color = '#dc3545'; }
            } else if (strength <= 4) {
                strengthBar.style.width = '66%';
                strengthBar.style.background = '#FFD700';
                if (strengthText) { strengthText.textContent = 'Medium'; strengthText.style.color = '#FFD700'; }
            } else {
                strengthBar.style.width = '100%';
                strengthBar.style.background = '#28a745';
                if (strengthText) { strengthText.textContent = 'Strong'; strengthText.style.color = '#28a745'; }
            }
        });
    }

    // --- 6. Show/hide password toggles ---
    document.querySelectorAll('[data-pwd-toggle]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const targetId = this.getAttribute('data-pwd-toggle');
            const input = document.getElementById(targetId);
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                this.innerHTML = '<i class="fa-solid fa-eye"></i>';
            }
        });
    });

    // --- 7. Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // --- 8. Active navbar link (JS fallback for static pages) ---
    const path = window.location.pathname;
    document.querySelectorAll('#mainNavbar .nav-link').forEach(function (link) {
        if (link.getAttribute('href') === path) {
            link.classList.add('nav-active');
        }
    });

});
