document.documentElement.classList.add('js');

// Sticky header shadow + back-to-top button
const header = document.querySelector('.site-header');
const toTop = document.getElementById('toTop');
window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 40);
    if (toTop) toTop.classList.toggle('show', y > 400);
});
if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Reveal elements as they enter the viewport (elements already on screen show at once)
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
} else {
    revealEls.forEach(el => el.classList.add('in'));
}

// Hero slider
const slides = document.querySelectorAll('.hero .slide');
if (slides.length) {
    const dotsBox = document.querySelector('.hero-dots');
    let current = 0;
    let timer;
    const dots = [...slides].map((_, i) => {
        const b = document.createElement('button');
        b.setAttribute('aria-label', 'Slide ' + (i + 1));
        b.addEventListener('click', () => show(i, true));
        dotsBox.appendChild(b);
        return b;
    });
    function show(i, manual) {
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = (i + slides.length) % slides.length;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
        if (manual) restart();
    }
    function restart() {
        clearInterval(timer);
        timer = setInterval(() => show(current + 1), 6000);
    }
    document.querySelector('.hero-arrow.prev').addEventListener('click', () => show(current - 1, true));
    document.querySelector('.hero-arrow.next').addEventListener('click', () => show(current + 1, true));
    show(0);
    restart();
}

// Animated counters
const counters = document.querySelectorAll('[data-count]');
if (counters.length && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const target = +el.dataset.count;
            const start = performance.now();
            const step = now => {
                const p = Math.min((now - start) / 1800, 1);
                el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3)));
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
            co.unobserve(el);
        });
    }, { threshold: 0.5 });
    counters.forEach(c => co.observe(c));
} else {
    counters.forEach(c => { c.textContent = c.dataset.count; });
}

// Gallery filter
const filterBtns = document.querySelectorAll('.filter-bar button');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.classList.toggle('hide', f !== '*' && !item.classList.contains(f));
        });
    });
});

// Lightbox for project and gallery images
const lightbox = document.getElementById('lightbox');
if (lightbox) {
    const lbImg = lightbox.querySelector('img');
    document.querySelectorAll('[data-lightbox]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            lbImg.src = a.getAttribute('href');
            lbImg.alt = a.dataset.lightbox;
            lightbox.classList.add('open');
        });
    });
    lightbox.addEventListener('click', e => {
        if (e.target !== lbImg) lightbox.classList.remove('open');
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') lightbox.classList.remove('open');
    });
}

// Enquiry form: sent by email through FormSubmit (https://formsubmit.co)
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/info@alfrescobestech.in';
const quoteForm = document.getElementById('quoteForm');
if (quoteForm) {
    const status = document.getElementById('formStatus');
    const btn = quoteForm.querySelector('button[type="submit"]');
    const showStatus = (cls, html) => {
        status.className = 'form-status ' + cls;
        status.innerHTML = html;
    };
    quoteForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (!quoteForm.checkValidity()) {
            quoteForm.reportValidity();
            return;
        }
        const d = new FormData(quoteForm);
        if (d.get('_honey')) return; // filled in only by spam bots
        const payload = {
            Name: d.get('name'),
            Phone: d.get('phone'),
            Email: d.get('email') || '-',
            Service: d.get('service'),
            Message: d.get('message'),
            _subject: 'Website enquiry: ' + d.get('service') + ' (' + d.get('name') + ')',
            _template: 'table'
        };
        if (d.get('email')) payload._replyto = d.get('email');

        btn.disabled = true;
        btn.textContent = 'Sending...';
        try {
            const res = await fetch(FORM_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || res.statusText);
            showStatus('ok', '<i class="fa-solid fa-circle-check me-2"></i>Thank you! Your enquiry has been sent. We will get back to you soon.');
            quoteForm.reset();
        } catch (err) {
            showStatus('err', '<i class="fa-solid fa-triangle-exclamation me-2"></i>Sorry, the message could not be sent. Please call us on <a href="tel:+919007302333">9007302333</a> or email <a href="mailto:info@alfrescobestech.in">info@alfrescobestech.in</a>.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Send Enquiry';
        }
    });
}
