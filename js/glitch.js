/* ===== Glitch 文字效果 + 通用动画工具 ===== */
(function (global) {
    'use strict';

    // 扫描线抖动
    function glitchText(el, duration = 400) {
        if (!el) return;
        el.classList.add('glitch-active');
        if (AudioUtil && AudioUtil.SFX && AudioUtil.SFX.glitch) {
            AudioUtil.SFX.glitch();
        }
        setTimeout(() => el.classList.remove('glitch-active'), duration);
    }

    // 数字递增
    function animateNumber(el, from, to, duration = 1500, suffix = '') {
        if (!el) return;
        const start = performance.now();
        const range = to - from;
        function tick(now) {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const value = Math.floor(from + range * eased);
            el.textContent = value + suffix;
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // 打字机效果
    function typewriter(el, text, speed = 30) {
        if (!el) return Promise.resolve();
        el.textContent = '';
        let i = 0;
        return new Promise(resolve => {
            function step() {
                if (i < text.length) {
                    el.textContent += text.charAt(i++);
                    if (AudioUtil && AudioUtil.SFX && AudioUtil.SFX.type) AudioUtil.SFX.type();
                    setTimeout(step, speed);
                } else {
                    resolve();
                }
            }
            step();
        });
    }

    // 滚动入场 - IntersectionObserver
    function observeReveals() {
        const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
        if (!els.length) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        els.forEach(el => io.observe(el));
    }

    // 视差
    function initParallax() {
        const items = document.querySelectorAll('.parallax-slow, .parallax-fast');
        if (!items.length) return;
        const handler = () => {
            const scrollY = window.scrollY;
            items.forEach(el => {
                const speed = el.classList.contains('parallax-fast') ? 0.3 : 0.15;
                el.style.transform = `translateY(${scrollY * speed}px)`;
            });
        };
        window.addEventListener('scroll', handler, { passive: true });
        handler();
    }

    // 数字格式化
    function pad(n, w = 2) {
        return String(n).padStart(w, '0');
    }

    // 时间格式化
    function formatTime(ts) {
        const d = new Date(ts);
        const now = Date.now();
        const diff = now - ts;
        if (diff < 60_000) return '刚刚';
        if (diff < 3_600_000) return Math.floor(diff / 60_000) + ' 分钟前';
        if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + ' 小时前';
        if (diff < 7 * 86_400_000) return Math.floor(diff / 86_400_000) + ' 天前';
        return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
    }

    // 抖动（光标/反馈）
    function shake(el, duration = 300) {
        if (!el) return;
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), duration);
    }

    global.FXUtil = {
        glitchText,
        animateNumber,
        typewriter,
        observeReveals,
        initParallax,
        pad,
        formatTime,
        shake
    };
})(window);
