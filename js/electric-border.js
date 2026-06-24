/* ===== ElectricBorder 电动边框组件（vanilla JS 版） =====
 * 原 React @react-bits/ElectricBorder 移植
 * 用法：
 *   <div data-electric-border
 *        data-electric-color="#7df9ff"
 *        data-electric-speed="1"
 *        data-electric-chaos="0.12"
 *        data-electric-radius="16"
 *        data-electric-thickness="2"
 *        data-electric-interactive="true">
 *     ...内容...
 *   </div>
 *
 *   或自动初始化：ElectricBorderUtil.init()
 */
(function (global) {
    'use strict';

    const TAG = '[ElectricBorder]';

    /* ---- 噪声函数 ---- */
    function random(x) {
        return (Math.sin(x * 12.9898) * 43758.5453) % 1;
    }

    function noise2D(x, y) {
        const i = Math.floor(x);
        const j = Math.floor(y);
        const fx = x - i;
        const fy = y - j;

        const a = random(i + j * 57);
        const b = random(i + 1 + j * 57);
        const c = random(i + (j + 1) * 57);
        const d = random(i + 1 + (j + 1) * 57);

        const ux = fx * fx * (3.0 - 2.0 * fx);
        const uy = fy * fy * (3.0 - 2.0 * fy);

        return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
    }

    function octavedNoise(x, octaves, lacunarity, gain, baseAmplitude, baseFrequency, time, seed, baseFlatness) {
        let y = 0;
        let amplitude = baseAmplitude;
        let frequency = baseFrequency;

        for (let i = 0; i < octaves; i++) {
            let octaveAmplitude = amplitude;
            if (i === 0) octaveAmplitude *= baseFlatness;
            y += octaveAmplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
            frequency *= lacunarity;
            amplitude *= gain;
        }

        return y;
    }

    function getCornerPoint(centerX, centerY, radius, startAngle, arcLength, progress) {
        const angle = startAngle + progress * arcLength;
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    }

    function getRoundedRectPoint(t, left, top, width, height, radius) {
        const straightWidth = width - 2 * radius;
        const straightHeight = height - 2 * radius;
        const cornerArc = (Math.PI * radius) / 2;
        const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
        const distance = t * totalPerimeter;

        let accumulated = 0;

        if (distance <= accumulated + straightWidth) {
            const progress = (distance - accumulated) / straightWidth;
            return { x: left + radius + progress * straightWidth, y: top };
        }
        accumulated += straightWidth;

        if (distance <= accumulated + cornerArc) {
            const progress = (distance - accumulated) / cornerArc;
            return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, progress);
        }
        accumulated += cornerArc;

        if (distance <= accumulated + straightHeight) {
            const progress = (distance - accumulated) / straightHeight;
            return { x: left + width, y: top + radius + progress * straightHeight };
        }
        accumulated += straightHeight;

        if (distance <= accumulated + cornerArc) {
            const progress = (distance - accumulated) / cornerArc;
            return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, progress);
        }
        accumulated += cornerArc;

        if (distance <= accumulated + straightWidth) {
            const progress = (distance - accumulated) / straightWidth;
            return { x: left + width - radius - progress * straightWidth, y: top + height };
        }
        accumulated += straightWidth;

        if (distance <= accumulated + cornerArc) {
            const progress = (distance - accumulated) / cornerArc;
            return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, progress);
        }
        accumulated += cornerArc;

        if (distance <= accumulated + straightHeight) {
            const progress = (distance - accumulated) / straightHeight;
            return { x: left, y: top + height - radius - progress * straightHeight };
        }
        accumulated += straightHeight;

        const progress = (distance - accumulated) / cornerArc;
        return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, progress);
    }

    /* ---- 工具 ---- */
    function hexToRgb(hex) {
        if (!hex) return [125, 249, 255];
        let h = hex.replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const n = parseInt(h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    /* ---- 构造 DOM 包装 ----
     * 把内容包到 [data-electric-border] 元素中，并插入 canvas / layers / corners
     */
    function wrapContent(contentHtml, opts) {
        const o = Object.assign({
            color: '#7df9ff',
            speed: 1,
            chaos: 0.12,
            radius: 16,
            thickness: 2,
            interactive: true,
            status: 'SHIELD ONLINE',
            corners: true
        }, opts || {});

        const dataAttrs =
            ` data-electric-border` +
            ` data-electric-color="${o.color}"` +
            ` data-electric-speed="${o.speed}"` +
            ` data-electric-chaos="${o.chaos}"` +
            ` data-electric-radius="${o.radius}"` +
            ` data-electric-thickness="${o.thickness}"` +
            (o.interactive ? ` data-electric-interactive="true"` : '') +
            (o.status ? ` data-electric-status="${o.status}"` : '');

        return `
        <div class="electric-border${o.interactive ? ' eb-interactive' : ''}"${dataAttrs}
             style="--electric-border-color:${o.color};border-radius:${o.radius}px;">
            <div class="eb-canvas-container">
                <canvas class="eb-canvas"></canvas>
            </div>
            <div class="eb-layers">
                <div class="eb-glow-1"></div>
                <div class="eb-glow-2"></div>
                <div class="eb-background-glow"></div>
            </div>
            ${o.corners ? `
            <span class="eb-corner eb-corner-tl"></span>
            <span class="eb-corner eb-corner-tr"></span>
            <span class="eb-corner eb-corner-bl"></span>
            <span class="eb-corner eb-corner-br"></span>
            ` : ''}
            ${o.status ? `<div class="eb-status"><span class="live-dot"></span>${o.status}</div>` : ''}
            <div class="eb-content">${contentHtml}</div>
        </div>`;
    }

    /* ---- ElectricBorder 实例 ---- */
    class ElectricBorderInstance {
        constructor(element) {
            this.element = element;
            this.color = element.dataset.electricColor || '#7df9ff';
            this.speed = parseFloat(element.dataset.electricSpeed) || 1;
            this.chaos = parseFloat(element.dataset.electricChaos) || 0.12;
            this.borderRadius = parseFloat(element.dataset.electricRadius) || 16;
            this.thickness = parseFloat(element.dataset.electricThickness) || 2;
            this.interactive = element.dataset.electricInteractive === 'true';
            this.status = element.dataset.electricStatus || '';

            this.canvas = element.querySelector('.eb-canvas');
            if (!this.canvas) {
                console.warn(TAG, '缺少 .eb-canvas 节点');
                return;
            }

            this.ctx = this.canvas.getContext('2d');
            this.time = 0;
            this.lastFrame = performance.now();
            this.animationId = null;
            this.hoverIntensity = 0;
            this.boost = 0;
            this.flash = 0;

            // 同步 CSS 变量
            element.style.setProperty('--electric-border-color', this.color);
            if (!element.style.borderRadius) {
                element.style.borderRadius = this.borderRadius + 'px';
            }

            this._resize = this._resize.bind(this);
            this._tick = this._tick.bind(this);
            this._onEnter = this._onEnter.bind(this);
            this._onLeave = this._onLeave.bind(this);
            this._onClick = this._onClick.bind(this);

            this._resize();

            this.resizeObserver = new ResizeObserver(this._resize);
            this.resizeObserver.observe(element);

            if (this.interactive) {
                element.addEventListener('mouseenter', this._onEnter);
                element.addEventListener('mouseleave', this._onLeave);
                element.addEventListener('click', this._onClick);
            }

            this._tick(performance.now());
        }

        _onEnter() {
            this.boost = 1;
            if (global.AudioUtil) AudioUtil.SFX.hover();
        }

        _onLeave() {
            this.boost = 0;
        }

        _onClick(e) {
            this.flash = 1;
            this.element.classList.add('eb-flash');
            setTimeout(() => this.element.classList.remove('eb-flash'), 350);

            if (global.AudioUtil) AudioUtil.SFX.glitch();
            if (global.CursorParticles) {
                const rgb = hexToRgb(this.color);
                CursorParticles.burst(e.clientX, e.clientY, 22, rgb);
            }
            if (global.Toast) {
                const status = this.status || 'POWER SURGE';
                Toast.show(`⚡ ${status} // 点击激活`, 'success');
            }
        }

        _resize() {
            const rect = this.element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const borderOffset = 60;
            const width = rect.width + borderOffset * 2;
            const height = rect.height + borderOffset * 2;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
            this.canvas.style.position = 'absolute';
            this.canvas.style.left = -borderOffset + 'px';
            this.canvas.style.top = -borderOffset + 'px';

            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(dpr, dpr);

            this.width = width;
            this.height = height;
            this.dpr = dpr;
            this.borderOffset = borderOffset;
        }

        _tick(currentTime) {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            if (dpr !== this.dpr) this._resize();

            const deltaTime = (currentTime - this.lastFrame) / 1000;
            this.lastFrame = currentTime;

            // 平滑过渡
            this.hoverIntensity += (this.boost - this.hoverIntensity) * 0.08;
            if (this.flash > 0) this.flash = Math.max(0, this.flash - 0.06);

            const speedMult = 1 + this.hoverIntensity * 0.6 + this.flash * 1.5;
            this.time += deltaTime * this.speed * speedMult;

            this._draw();
            this.animationId = requestAnimationFrame(this._tick);
        }

        _draw() {
            const ctx = this.ctx;
            const octaves = 10;
            const lacunarity = 1.6;
            const gain = 0.7;
            const amplitude = this.chaos + this.hoverIntensity * 0.05 + this.flash * 0.15;
            const frequency = 10;
            const baseFlatness = 0;
            const displacement = 60;
            const borderOffset = this.borderOffset;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.scale(this.dpr, this.dpr);

            const lineWidth = this.thickness + this.hoverIntensity * 1.5 + this.flash * 4;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 6 + this.hoverIntensity * 14 + this.flash * 24;

            const left = borderOffset;
            const top = borderOffset;
            const borderWidth = this.width - 2 * borderOffset;
            const borderHeight = this.height - 2 * borderOffset;
            const maxRadius = Math.min(borderWidth, borderHeight) / 2;
            const radius = Math.min(this.borderRadius, maxRadius);

            const approximatePerimeter = 2 * (borderWidth + borderHeight) + 2 * Math.PI * radius;
            const sampleCount = Math.floor(approximatePerimeter / 2);

            ctx.beginPath();
            for (let i = 0; i <= sampleCount; i++) {
                const progress = i / sampleCount;
                const point = getRoundedRectPoint(progress, left, top, borderWidth, borderHeight, radius);

                const xNoise = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, this.time, 0, baseFlatness);
                const yNoise = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, this.time, 1, baseFlatness);

                const displacedX = point.x + xNoise * displacement;
                const displacedY = point.y + yNoise * displacement;

                if (i === 0) ctx.moveTo(displacedX, displacedY);
                else ctx.lineTo(displacedX, displacedY);
            }
            ctx.closePath();
            ctx.stroke();
        }

        destroy() {
            if (this.animationId) cancelAnimationFrame(this.animationId);
            if (this.resizeObserver) this.resizeObserver.disconnect();
            if (this.interactive) {
                this.element.removeEventListener('mouseenter', this._onEnter);
                this.element.removeEventListener('mouseleave', this._onLeave);
                this.element.removeEventListener('click', this._onClick);
            }
            delete this.element._ebInstance;
        }
    }

    /* ---- 初始化入口 ---- */
    function init(scope) {
        const root = scope || document;
        const els = root.querySelectorAll('[data-electric-border]');
        let count = 0;
        els.forEach(el => {
            if (el._ebInstance) return;
            try {
                el._ebInstance = new ElectricBorderInstance(el);
                count++;
            } catch (err) {
                console.warn(TAG, '初始化失败：', err);
            }
        });
        return count;
    }

    function destroyAll(scope) {
        const root = scope || document;
        root.querySelectorAll('[data-electric-border]').forEach(el => {
            if (el._ebInstance) el._ebInstance.destroy();
        });
    }

    global.ElectricBorderUtil = {
        init,
        destroy: destroyAll,
        wrap: wrapContent,
        create: ElectricBorderInstance
    };
})(window);
