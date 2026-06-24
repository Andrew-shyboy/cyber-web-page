/* ===== 首页 Landing Page (增强版) ===== */
(function (global) {
    'use strict';

    function render() {
        return `
        <div class="page landing">
            <!-- 巨型背景数字 -->
            <div class="bg-mega" data-text="2081">2081</div>

            <!-- HERO -->
            <section class="landing-hero">
                <div class="corner-deco corner-tl"></div>
                <div class="corner-deco corner-tr"></div>
                <div class="corner-deco corner-bl"></div>
                <div class="corner-deco corner-br"></div>

                <div class="landing-eyebrow">
                    <span>SYSTEM ONLINE</span>
                    <span class="dot-sep"></span>
                    <span>NIGHT CITY</span>
                    <span class="dot-sep"></span>
                    <span class="v-tag">v1.0</span>
                </div>

                <h1 class="landing-title">
                    <span class="line glitch" data-text="BUILD YOUR">BUILD YOUR</span>
                    <span class="line">
                        <span class="accent glitch" data-text="CYBER">CYBER</span>
                        <span class="accent-2 glitch" data-text="RESUME">RESUME</span>
                    </span>
                </h1>

                <p class="landing-subtitle fade-in-up delay-3">
                    30 秒生成属于你自己的<span class="hl">赛博朋克风格个人主页</span>。
                    上传资料、定制主题、<span class="hl">一键发布专属网址</span>。
                    数据归你所有，<span class="hl">隐私由你掌控</span>。
                </p>

                <div class="landing-cta fade-in-up delay-5">
                    <a href="#/editor" class="btn btn--pink btn--xl">
                        <span>▶</span> 开始制作
                    </a>
                    <a href="#/dashboard" class="btn btn--xl btn--ghost">查看我的简历</a>
                </div>

                <!-- 实时数据条 -->
                <div class="live-stats fade-in-up delay-6">
                    <div class="live-stat">
                        <span class="num" data-count="2077">0</span>
                        <span class="lbl">/ YEAR 赛博元年</span>
                    </div>
                    <div class="live-stat">
                        <span class="num pink" data-count="30" data-suffix="s">0</span>
                        <span class="lbl">/ 生成时间</span>
                    </div>
                    <div class="live-stat">
                        <span class="num" data-count="6">0</span>
                        <span class="lbl">/ 主题数量</span>
                    </div>
                    <div class="live-stat">
                        <span class="num pink" data-count="100" data-suffix="%">0</span>
                        <span class="lbl">/ 隐私自主</span>
                    </div>
                </div>

                <div class="scroll-hint">SCROLL TO JACK IN ▼</div>
            </section>

            <!-- 滚动条幅 -->
            <div class="marquee">
                <div class="marquee-track">
                    ${marqueeItems()}
                    ${marqueeItems()}
                </div>
            </div>

            <!-- 特性 -->
            <section class="section">
                <div class="section-header reveal">
                    <div class="section-tag">// CAPABILITIES //</div>
                    <h2 class="section-title">六大核心<span class="accent">能力</span></h2>
                    <p class="section-desc">一切为了让你在赛博世界里脱颖而出</p>
                </div>
                <div class="features-grid">
                    ${featureCard('01', '◢', '3D 沉浸场景', 'Three.js 实时渲染的赛博朋克城市，每个页面都是独立的视觉奇观。粒子、光晕、故障、扫描线...', 'cyan')}
                    ${featureCard('02', '◆', '字段级隐私', '每一个信息都有独立的可见性开关。电话邮箱默认隐藏，发布前明示要公开什么。', 'pink')}
                    ${featureCard('03', '⚡', 'URL 嵌入式分享', '无需后端服务器。简历数据直接编码到 URL，分享即传播，永久生效。', 'cyan')}
                    ${featureCard('04', '◈', '主题自由调色', '主色、强调色、背景全可调。内置 6 套预设，从经典霓虹到虚空紫一键切换。', 'pink')}
                    ${featureCard('05', '▣', '导出 PDF/JSON', '想留本地？一键导出高保真 PDF，或下载 JSON 备份。数据完全可控。', 'cyan')}
                    ${featureCard('06', '◉', '程序化赛博头像', '无需上传照片，根据种子数生成独一无二的程序化头像，保护隐私又有范儿。', 'pink')}
                </div>
            </section>

            <!-- 巨型统计区 -->
            <section class="mega-stats">
                <div class="mega-stats-grid">
                    <div class="mega-stat reveal">
                        <div class="num"><span data-count="30">0</span><span class="suffix">S</span></div>
                        <div class="lbl">生成一份简历</div>
                    </div>
                    <div class="mega-stat reveal">
                        <div class="num"><span data-count="6">0</span><span class="suffix">+</span></div>
                        <div class="lbl">主题预设</div>
                    </div>
                    <div class="mega-stat reveal">
                        <div class="num"><span data-count="100">0</span><span class="suffix">%</span></div>
                        <div class="lbl">本地数据自主</div>
                    </div>
                    <div class="mega-stat reveal">
                        <div class="num"><span data-count="0">0</span><span class="suffix">ms</span></div>
                        <div class="lbl">追踪与广告</div>
                    </div>
                </div>
            </section>

            <!-- 命令行展示 -->
            <section class="showcase">
                <div class="showcase-text reveal-left">
                    <div class="section-tag">// WORKFLOW //</div>
                    <h2 class="section-title">四步<span class="accent-2">完成</span></h2>
                    <p>从空白页面到专属赛博主页，<span class="hl">只需四步</span>。整个过程无需注册账号、无需后端服务、无需懂代码。</p>
                    <ul class="command-list">
                        <li>
                            <span class="cmd">$ init</span>
                            <span class="desc">创建你的第一份简历</span>
                            <span class="step">// STEP 01</span>
                        </li>
                        <li>
                            <span class="cmd">$ upload</span>
                            <span class="desc">填写基础信息、技能、经历</span>
                            <span class="step">// STEP 02</span>
                        </li>
                        <li>
                            <span class="cmd">$ customize</span>
                            <span class="desc">选择主题、调整可见性</span>
                            <span class="step">// STEP 03</span>
                        </li>
                        <li>
                            <span class="cmd">$ deploy</span>
                            <span class="desc">一键发布获得专属 URL</span>
                            <span class="step">// STEP 04</span>
                        </li>
                    </ul>
                </div>
                <div class="reveal-right">
                    <div class="terminal scan-sweep">
                        <div class="terminal-header">
                            <span class="terminal-dot"></span>
                            <span class="terminal-dot"></span>
                            <span class="terminal-dot"></span>
                            <span class="terminal-title">cyber-resume ~ terminal</span>
                        </div>
                        <div class="terminal-body" id="terminal-body">
                            <!-- 内容由 JS 注入 -->
                        </div>
                    </div>
                </div>
            </section>

            <!-- 宣言 -->
            <section class="manifesto">
                <div class="manifesto-inner reveal">
                    <div class="manifesto-text">
                        代码是我的武器，<br>
                        <span class="hl">霓虹</span>是我的<span class="hl-2">信仰</span>。
                    </div>
                    <div class="manifesto-sig">— A.D. 2081 // NIGHT CITY RESIDENT</div>
                </div>
            </section>

            <!-- 制作流程 -->
            <section class="workflow">
                <div class="section-header reveal">
                    <div class="section-tag">// JOURNEY //</div>
                    <h2 class="section-title">制作<span class="accent">流程</span></h2>
                </div>
                <div class="workflow-steps">
                    ${workflowStep('01', 'CREATE', '创建草稿', '点击「开始制作」，自动生成带示例数据的草稿。')}
                    ${workflowStep('02', 'EDIT', '编辑内容', '在左侧表单填写你的资料，右侧实时预览。')}
                    ${workflowStep('03', 'STYLE', '定制主题', '选择预设主题或自由调色，3D 场景跟随响应。')}
                    ${workflowStep('04', 'PUBLISH', '发布分享', '一键获得专属 URL，分享到任何地方。')}
                </div>
            </section>

            <!-- 隐私 -->
            <section class="privacy">
                <div class="section-header reveal">
                    <div class="section-tag">// SECURITY //</div>
                    <h2 class="section-title">你的<span class="accent-2">数据</span>，你掌控</h2>
                    <p class="section-desc">默认情况下，所有数据都只存储在你的浏览器中。我们不收集任何信息。</p>
                </div>
                <div class="privacy-grid">
                    <div class="privacy-item reveal">
                        <div class="privacy-icon">🔒</div>
                        <div class="privacy-title">本地存储</div>
                        <div class="privacy-desc">所有数据仅存于浏览器 LocalStorage，清除浏览器数据 = 完全清除。</div>
                    </div>
                    <div class="privacy-item reveal">
                        <div class="privacy-icon">🚫</div>
                        <div class="privacy-title">无后端追踪</div>
                        <div class="privacy-desc">纯前端实现，零后端服务，零用户行为收集，零 Cookie 跟踪。</div>
                    </div>
                    <div class="privacy-item reveal">
                        <div class="privacy-icon">🔓</div>
                        <div class="privacy-title">URL 自主可控</div>
                        <div class="privacy-desc">公开页面通过 URL hash 编码传播，无服务器可下架、可重新生成。</div>
                    </div>
                </div>
            </section>

            <!-- 终局 CTA -->
            <section class="cta-section reveal-scale">
                <h2 class="cta-title glitch" data-text="READY TO JACK IN?">READY TO <span class="hl">JACK</span> IN?</h2>
                <p class="cta-desc">立即开始，制作你的赛博朋克风格个人主页</p>
                <div class="flex gap-4 justify-center" style="flex-wrap:wrap;">
                    <a href="#/editor" class="btn btn--pink btn--xl">▶ 开始制作</a>
                    <a href="#/dashboard" class="btn btn--xl btn--ghost">查看示例</a>
                </div>
            </section>

            <footer class="landing-footer">
                <div>// CYBER.RESUME.MAKER · 纯前端 MVP · 数据不离开你的设备 //</div>
                <div class="mt-2">
                    BUILT WITH <span style="color:var(--neon-pink);">♥</span> USING THREE.JS · HTML5 · LOCALSTORAGE
                </div>
            </footer>
        </div>
        `;
    }

    function marqueeItems() {
        const items = ['CYBER.RESUME', '◆', 'NO BACKEND', '◆', 'DATA IS YOURS', '◆', 'JACK IN', '◆', 'STAY ANONYMOUS', '◆', 'GHOST PROTOCOL', '◆', '2081', '◆', 'NEON NEVER DIES'];
        return items.map(t =>
            t === '◆'
                ? `<span class="marquee-item"><span class="star">✦</span></span>`
                : `<span class="marquee-item">${t}</span>`
        ).join('');
    }

    function featureCard(num, icon, title, desc) {
        return `
        <div class="feature-card reveal">
            <span class="feature-num">${num}</span>
            <div class="feature-icon"><span>${icon}</span></div>
            <h3 class="feature-title">${title}</h3>
            <p class="feature-desc">${desc}</p>
        </div>`;
    }

    function workflowStep(num, label, title, desc) {
        return `
        <div class="workflow-step reveal">
            <div class="step-num">${num}</div>
            <div class="step-title">${title}</div>
            <div class="step-desc">${desc}</div>
            <div class="tab-num mt-2">[${label}]</div>
        </div>`;
    }

    function onMount() {
        if (global.LandingScene) LandingScene.init();
        if (global.FXUtil) {
            FXUtil.observeReveals();
            FXUtil.initParallax();
        }
        initTerminal();
        initCounters();

        document.querySelectorAll('.nav-menu a').forEach(a => {
            if (a.dataset.link === '/') a.classList.add('active');
            else a.classList.remove('active');
        });
    }

    function onUnmount() {
        if (global.LandingScene) LandingScene.stop();
    }

    function initCounters() {
        const counters = document.querySelectorAll('[data-count]');
        if (!counters.length) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const el = e.target;
                    const target = parseInt(el.dataset.count);
                    const suffix = el.dataset.suffix || '';
                    if (global.FXUtil) FXUtil.animateNumber(el, 0, target, 1500, suffix);
                    io.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(c => io.observe(c));
    }

    function initTerminal() {
        const body = document.getElementById('terminal-body');
        if (!body) return;
        const lines = [
            { key: '$ init', comment: '// 初始化系统', delay: 100 },
            { key: '> ', val: '欢迎来到赛博简历生成器 v1.0', delay: 200 },
            { key: '> ', val: '扫描环境...', delay: 150 },
            { key: '> ', val: '✓ 经典霓虹粉+青 已激活', delay: 100 },
            { key: '$ scan --privacy', comment: '// 隐私扫描', delay: 400 },
            { key: '> ', val: '✓ 数据仅本地存储', delay: 150 },
            { key: '> ', val: '✓ 联系方式默认隐藏', delay: 100 },
            { key: '> ', val: '✓ 无后端追踪', delay: 100 },
            { key: '$ deploy', comment: '// 发布', delay: 500 },
            { key: '> ', val: '生成专属 URL...', delay: 250 },
            { key: '> ', val: '✓ 你的赛博主页已上线', delay: 200 },
            { key: '> ', val: 'READY ▸ ', interactive: true, delay: 200 }
        ];
        let i = 0;
        function next() {
            if (i >= lines.length) return;
            const line = lines[i++];
            const el = document.createElement('div');
            el.className = 'terminal-line';
            if (line.interactive) {
                el.innerHTML = `<span class="comment">${line.val}</span><span class="blink">_</span>`;
            } else {
                let html = '';
                if (line.key) html += `<span class="key">${line.key}</span> `;
                if (line.val) html += `<span class="val">${line.val}</span>`;
                if (line.comment) html += `<span class="comment">${line.comment}</span>`;
                el.innerHTML = html;
            }
            body.appendChild(el);
            body.scrollTop = body.scrollHeight;
            setTimeout(next, line.delay || 200);
        }
        next();
    }

    global.LandingPage = { render, onMount, onUnmount };
})(window);
