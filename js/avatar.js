/* ===== 头像生成器（程序化赛博几何头像） + 雷达图 ===== */
(function (global) {
    'use strict';

    // 简单的种子化伪随机
    function mulberry32(seed) {
        return function () {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function hexToRgb(hex) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 42, 109];
    }
    function rgbToCss(r, g, b, a = 1) { return `rgba(${r},${g},${b},${a})`; }

    // 程序化赛博头像
    function render(canvas, seed) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const size = canvas.clientWidth || canvas.width;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const W = size, H = size;
        const rand = mulberry32(seed || 1);

        // 背景
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        const bgHue1 = Math.floor(rand() * 360);
        const bgHue2 = (bgHue1 + 60 + Math.floor(rand() * 80)) % 360;
        bgGrad.addColorStop(0, `hsl(${bgHue1}, 50%, 8%)`);
        bgGrad.addColorStop(1, `hsl(${bgHue2}, 50%, 5%)`);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // 主色
        const primary = hexToRgb(getCssVar('--neon-pink') || '#ff2a6d');
        const secondary = hexToRgb(getCssVar('--neon-cyan') || '#05d9e8');

        // 主体几何形
        const type = Math.floor(rand() * 5);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        const drawType = Math.floor(rand() * 4);

        if (drawType === 0) {
            // 多面体
            const sides = 5 + Math.floor(rand() * 4);
            const r = W * 0.32;
            ctx.rotate(rand() * Math.PI);
            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const a = (i / sides) * Math.PI * 2;
                const x = Math.cos(a) * r;
                const y = Math.sin(a) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = rgbToCss(...primary, 0.9);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = rgbToCss(...primary, 0.15);
            ctx.fill();
        } else if (drawType === 1) {
            // 环
            for (let i = 0; i < 3; i++) {
                const r = W * (0.18 + i * 0.08);
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.strokeStyle = i % 2 === 0 ? rgbToCss(...primary, 0.8) : rgbToCss(...secondary, 0.8);
                ctx.lineWidth = 1 + i * 0.5;
                ctx.stroke();
            }
        } else if (drawType === 2) {
            // 中心向外辐射
            const rays = 8 + Math.floor(rand() * 8);
            for (let i = 0; i < rays; i++) {
                const a = (i / rays) * Math.PI * 2;
                const r1 = W * 0.1;
                const r2 = W * (0.3 + rand() * 0.1);
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
                ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
                ctx.strokeStyle = rgbToCss(...primary, 0.5 + rand() * 0.4);
                ctx.lineWidth = 0.8 + rand() * 1.2;
                ctx.stroke();
            }
        } else {
            // 同心环 + 装饰
            for (let i = 0; i < 5; i++) {
                const r = W * (0.1 + i * 0.06);
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.strokeStyle = i % 2 === 0 ? rgbToCss(...primary, 0.6) : rgbToCss(...secondary, 0.4);
                ctx.lineWidth = 0.6;
                ctx.stroke();
            }
        }
        ctx.restore();

        // 中心脸部符号
        ctx.save();
        ctx.translate(W / 2, H / 2);

        // 网格装饰
        const gridSize = 4;
        ctx.strokeStyle = rgbToCss(...primary, 0.2);
        ctx.lineWidth = 0.5;
        for (let i = -gridSize; i <= gridSize; i++) {
            const p = (i / gridSize) * W * 0.4;
            ctx.beginPath();
            ctx.moveTo(p, -W * 0.4);
            ctx.lineTo(p, W * 0.4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-W * 0.4, p);
            ctx.lineTo(W * 0.4, p);
            ctx.stroke();
        }

        // 字母/字符
        const symbols = ['X', 'Z', '0', '1', '◆', '◤', '◢', '⬡', '◈', '◇', '△', '▽', 'NULL', 'SYS', 'AI', 'NET', 'VOID', 'ERR', 'HACK'];
        const sym = symbols[Math.floor(rand() * symbols.length)];
        ctx.fillStyle = rgbToCss(...primary, 0.95);
        ctx.shadowBlur = 12;
        ctx.shadowColor = rgbToCss(...primary, 0.8);
        ctx.font = `bold ${W * 0.28}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sym, 0, 0);
        ctx.shadowBlur = 0;

        // 二维码样装饰
        const dotCount = 20;
        for (let i = 0; i < dotCount; i++) {
            const x = (rand() - 0.5) * W * 0.8;
            const y = (rand() - 0.5) * H * 0.8;
            const dist = Math.hypot(x, y);
            if (dist < W * 0.35 && dist > W * 0.15) {
                ctx.fillStyle = rgbToCss(...secondary, 0.4 + rand() * 0.4);
                ctx.fillRect(x, y, 1.5, 1.5);
            }
        }
        ctx.restore();

        // 边框装饰
        ctx.strokeStyle = rgbToCss(...primary, 0.5);
        ctx.lineWidth = 1;
        ctx.strokeRect(2, 2, W - 4, H - 4);

        // 角标
        const corner = 10;
        ctx.strokeStyle = rgbToCss(...primary, 1);
        ctx.lineWidth = 1.5;
        // 左上
        ctx.beginPath();
        ctx.moveTo(0, corner);
        ctx.lineTo(0, 0);
        ctx.lineTo(corner, 0);
        ctx.stroke();
        // 右下
        ctx.beginPath();
        ctx.moveTo(W - corner, H);
        ctx.lineTo(W, H);
        ctx.lineTo(W, H - corner);
        ctx.stroke();
    }

    // 雷达图
    function renderRadar(canvas, data) {
        if (!canvas || !data || data.length < 3) return;
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const size = canvas.clientWidth || canvas.width;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const W = size, H = size;
        const cx = W / 2, cy = H / 2;
        const radius = Math.min(W, H) * 0.38;
        const sides = data.length;

        const primary = hexToRgb(getCssVar('--neon-pink') || '#ff2a6d');
        const secondary = hexToRgb(getCssVar('--neon-cyan') || '#05d9e8');

        // 同心环
        for (let level = 1; level <= 4; level++) {
            ctx.beginPath();
            const r = radius * (level / 4);
            for (let i = 0; i < sides; i++) {
                const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
                const x = cx + Math.cos(a) * r;
                const y = cy + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = rgbToCss(...secondary, 0.15);
            ctx.lineWidth = 0.5;
            ctx.stroke();
            // 标签
            if (level === 4) {
                ctx.fillStyle = rgbToCss(...secondary, 0.5);
                ctx.font = '9px Share Tech Mono';
                ctx.textAlign = 'center';
                for (let i = 0; i < sides; i++) {
                    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
                    const x = cx + Math.cos(a) * (r + 12);
                    const y = cy + Math.sin(a) * (r + 12);
                    ctx.fillText((level * 25).toString(), x, y);
                }
            }
        }

        // 轴线
        for (let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
            ctx.strokeStyle = rgbToCss(...secondary, 0.2);
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // 数据多边形
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const v = Math.max(0, Math.min(100, data[i].value)) / 100;
            const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const r = radius * v;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = rgbToCss(...primary, 0.25);
        ctx.fill();
        ctx.strokeStyle = rgbToCss(...primary, 1);
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = rgbToCss(...primary, 0.6);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 顶点
        for (let i = 0; i < sides; i++) {
            const v = Math.max(0, Math.min(100, data[i].value)) / 100;
            const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const r = radius * v;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = rgbToCss(...secondary, 1);
            ctx.shadowBlur = 8;
            ctx.shadowColor = rgbToCss(...secondary, 0.8);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // 标签
        ctx.fillStyle = rgbToCss(...primary, 1);
        ctx.font = 'bold 11px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(a) * (radius + 22);
            const y = cy + Math.sin(a) * (radius + 22);
            const name = data[i].name;
            // 简单多行处理
            ctx.fillText(name, x, y);
        }
    }

    function getCssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    global.AvatarGen = { render, renderRadar };
})(window);
