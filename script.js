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

// Job application form: a normal multipart post so FormSubmit can attach the CV file
const careerForm = document.getElementById('careerForm');
if (careerForm) {
    const MAX_CV_BYTES = 5 * 1024 * 1024;
    const fileInput = careerForm.querySelector('input[type="file"]');
    const fileName = careerForm.querySelector('.file-name');
    const drop = careerForm.querySelector('.file-drop');
    const status = careerForm.querySelector('.form-status');
    const showError = msg => {
        status.className = 'form-status err';
        status.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-2"></i>' + msg;
    };
    fileInput.addEventListener('change', () => {
        const f = fileInput.files[0];
        drop.classList.toggle('has-file', !!f);
        fileName.textContent = f ? f.name + ' (' + (f.size / 1048576).toFixed(1) + ' MB)' : 'Upload your CV';
        status.className = 'form-status';
        status.innerHTML = '';
    });
    careerForm.addEventListener('submit', e => {
        if (!careerForm.checkValidity()) {
            e.preventDefault();
            careerForm.reportValidity();
            return;
        }
        const f = fileInput.files[0];
        const link = careerForm.elements['CV Link'].value.trim();
        if (!f && !link) {
            e.preventDefault();
            return showError('Please upload your CV or paste a link to it.');
        }
        if (f && !/\.(pdf|docx?)$/i.test(f.name)) {
            e.preventDefault();
            return showError('Please upload your CV as a PDF or Word file.');
        }
        if (f && f.size > MAX_CV_BYTES) {
            e.preventDefault();
            return showError('Your file is larger than 5 MB. Please upload a smaller file or paste a link to your CV instead.');
        }
        if (careerForm.elements._honey.value) {
            e.preventDefault();
            return; // filled in only by spam bots
        }
        const name = careerForm.elements.Name.value.trim();
        careerForm.elements._subject.value = 'Job application: ' + careerForm.elements.Position.value + ' (' + name + ')';
        careerForm.elements._next.value = location.origin + '/thank-you.html';
        const btn = careerForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Uploading...';
    });
}

// Enquiry form: sent by email through FormSubmit (https://formsubmit.co)
// Each form lists its fields as data-label attributes and sets data-subject / data-success.
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/info@alfrescobestech.in';
document.querySelectorAll('form[data-subject]').forEach(form => {
    const status = form.querySelector('.form-status');
    const btn = form.querySelector('button[type="submit"]');
    const btnText = btn.textContent;
    const showStatus = (cls, html) => {
        status.className = 'form-status ' + cls;
        status.innerHTML = html;
    };
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        if (form.elements._honey && form.elements._honey.value) return; // filled in only by spam bots
        const payload = {};
        form.querySelectorAll('[data-label]').forEach(el => {
            payload[el.dataset.label] = el.value.trim() || '-';
        });
        const name = form.elements.name ? form.elements.name.value.trim() : '';
        const topic = form.elements.topic ? form.elements.topic.value : '';
        payload._subject = form.dataset.subject + (topic ? ': ' + topic : '') + (name ? ' (' + name + ')' : '');
        payload._template = 'table';
        if (form.elements.email && form.elements.email.value) payload._replyto = form.elements.email.value;

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
            showStatus('ok', '<i class="fa-solid fa-circle-check me-2"></i>' + form.dataset.success);
            form.reset();
        } catch (err) {
            showStatus('err', '<i class="fa-solid fa-triangle-exclamation me-2"></i>Sorry, the message could not be sent. Please call us on <a href="tel:+919007302333">9007302333</a> or email <a href="mailto:info@alfrescobestech.in">info@alfrescobestech.in</a>.');
        } finally {
            btn.disabled = false;
            btn.textContent = btnText;
        }
    });
});
