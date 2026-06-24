/* ===== 光标粒子 ===== */
(function (global) {
    'use strict';

    let canvas, ctx, particles = [];
    let mouseX = 0, mouseY = 0;
    let lastX = 0, lastY = 0;
    let width = 0, height = 0;
    let dpr = 1;
    let enabled = true;
    let lastSpawn = 0;
    const SPAWN_INTERVAL = 16; // ms

    function isMobile() {
        return matchMedia('(max-width: 768px)').matches;
    }

    function init() {
        if (isMobile()) {
            const c = document.getElementById('cursor-particles');
            if (c) c.style.display = 'none';
            enabled = false;
            return;
        }
        canvas = document.getElementById('cursor-particles');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        resize();

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }, { passive: true });

        window.addEventListener('resize', resize);
        loop();
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
    }

    function spawn() {
        const dx = mouseX - lastX;
        const dy = mouseY - lastY;
        const speed = Math.hypot(dx, dy);
        const count = Math.min(Math.floor(speed / 4) + 1, 4);
        for (let i = 0; i < count; i++) {
            const t = Math.random();
            const x = lastX + dx * t + (Math.random() - 0.5) * 6;
            const y = lastY + dy * t + (Math.random() - 0.5) * 6;
            const colorPick = Math.random();
            let color;
            if (colorPick < 0.45) color = [255, 42, 109];
            else if (colorPick < 0.85) color = [5, 217, 232];
            else color = [211, 0, 197];
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                life: 1,
                decay: 0.012 + Math.random() * 0.018,
                size: 1 + Math.random() * 2.2,
                color
            });
        }
    }

    function loop() {
        if (!enabled) return;
        ctx.clearRect(0, 0, width, height);

        const now = performance.now();
        if (now - lastSpawn > SPAWN_INTERVAL) {
            lastX = mouseX;
            lastY = mouseY;
            spawn();
            lastSpawn = now;
        }

        // 更新 + 绘制
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.04;
            p.vx *= 0.98;
            p.life -= p.decay;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            const [r, g, b] = p.color;
            ctx.fillStyle = `rgba(${r},${g},${b},${p.life * 0.9})`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = `rgba(${r},${g},${b},${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // 限制粒子数
        if (particles.length > 400) particles.splice(0, particles.length - 400);

        requestAnimationFrame(loop);
    }

    function burst(x, y, count = 30, color) {
        if (!enabled) return;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.015 + Math.random() * 0.02,
                size: 1 + Math.random() * 2,
                color: color || [255, 42, 109]
            });
        }
    }

    function setEnabled(v) {
        enabled = !!v;
        const c = document.getElementById('cursor-particles');
        if (c) c.style.display = enabled ? 'block' : 'none';
        if (!enabled) particles = [];
    }

    global.CursorParticles = {
        init,
        burst,
        setEnabled
    };
})(window);
