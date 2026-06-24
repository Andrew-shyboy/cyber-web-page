/* ===== 简历视图（编辑器预览 + 公开页通用） ===== */
(function (global) {
    'use strict';

    function escAttr(s) { return (s || '').replace(/"/g, '&quot;'); }
    function escHtml(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function hasContact(r) {
        const v = r.contact.visibility;
        return (v.email && r.contact.email) ||
               (v.phone && r.contact.phone) ||
               (v.website && r.contact.website) ||
               (v.location && r.contact.location);
    }

    function hasSocials(r) {
        const v = r.socials.visibility;
        return Object.entries(v).some(([k, vis]) => vis && r.socials[k]);
    }

    function render(r, opts = {}) {
        const { mode = 'full', forPDF = false, embedded = false, electricHero = false } = opts;
        const isCompact = mode === 'mobile' || (mode === 'desktop' && !embedded);

        // 检测哪些需要展示
        const showBio = r.basic.visibility.bio && r.basic.bio;
        const showSkills = r.skills.visibility && r.skills.list.length;
        const showRadar = r.radar.visibility && r.radar.list.length >= 3;
        const showExp = r.experience.visibility && r.experience.list.length;

        const username = r.username || 'guest';
        const idLabel = `ID: ${username.toUpperCase()}`;

        let html = `<div class="resume-page-inner" style="position:relative;">`;

        // 浮动操作（仅公开页）
        if (!embedded && !forPDF) {
            html += `
            <div class="resume-actions">
                <button class="btn-icon" id="btn-pdf-public" title="导出 PDF">
                    <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h2v4H8v-4zm6 0c1.1 0 2 .9 2 2v0c0 1.1-.9 2-2 2h-2v-4h2z"/></svg>
                </button>
                <button class="btn-icon" id="btn-copy-public" title="复制链接">
                    <svg viewBox="0 0 24 24"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>
                </button>
            </div>`;
        }

        // 头部（个人卡片）
        const heroHtml = `
        <div class="resume-hero">
            <div class="resume-avatar">
                <div class="avatar-frame">
                    <canvas data-avatar="${r.basic.avatarSeed}" width="160" height="160"></canvas>
                </div>
            </div>
            <div class="resume-info">
                ${r.basic.visibility.name ? `<h1 class="resume-name glitch" data-text="${escAttr(r.basic.name || 'ANONYMOUS')}">${escHtml(r.basic.name || 'ANONYMOUS')}</h1>` : ''}
                ${r.basic.visibility.title && r.basic.title ? `<div class="resume-title">${escHtml(r.basic.title)}</div>` : ''}
                <div class="resume-id">// ${idLabel}</div>
                ${showBio ? `<p class="resume-bio">${formatBio(r.basic.bio)}</p>` : ''}
                ${hasSocials(r) ? renderSocials(r) : ''}
            </div>
        </div>`;

        if (electricHero) {
            // 用 ElectricBorder 包裹个人卡片头部
            const themeColor = (r.theme && r.theme.primary) || '#7df9ff';
            if (global.ElectricBorderUtil) {
                html += ElectricBorderUtil.wrap(heroHtml, {
                    color: themeColor,
                    speed: 1,
                    chaos: 0.14,
                    radius: 18,
                    thickness: 2,
                    interactive: true,
                    status: 'IDENTITY · VERIFIED',
                    corners: true
                });
            } else {
                html += heroHtml;
            }
        } else {
            html += heroHtml;
        }

        // 联系信息（默认隐藏，需要点击查看）
        if (hasContact(r) && !forPDF) {
            html += `
            <div class="contact-reveal">
                <button class="contact-reveal-btn" id="contact-reveal-btn">📡 查看联系方式</button>
                <div class="contact-reveal-content" id="contact-content" style="display:none;">
                    ${renderContactList(r)}
                </div>
            </div>`;
        } else if (hasContact(r) && forPDF) {
            // PDF 直接显示
            html += `
            <div class="resume-section">
                <h2 class="resume-section-title">联系方式 <span class="num">[04]</span></h2>
                ${renderContactList(r)}
            </div>`;
        }

        // 技能
        if (showSkills) {
            html += `
            <div class="resume-section">
                <h2 class="resume-section-title">技能矩阵 <span class="num">[01]</span></h2>
                <div class="skill-tags">
                    ${r.skills.list.map(s => `<span class="skill-tag" style="--level:${s.level}%;">${escHtml(s.name)}<span style="color:var(--text-muted);font-size:10px;margin-left:4px;">${s.level}</span></span>`).join('')}
                </div>
            </div>`;
        }

        // 雷达
        if (showRadar) {
            html += `
            <div class="resume-section">
                <h2 class="resume-section-title">能力雷达 <span class="num">[02]</span></h2>
                <div class="skill-radar">
                    <canvas data-radar-canvas width="400" height="400"></canvas>
                </div>
            </div>`;
        }

        // 经历
        if (showExp) {
            const visibleItems = r.experience.list.filter(e => e.visible !== false);
            if (visibleItems.length) {
                html += `
                <div class="resume-section">
                    <h2 class="resume-section-title">工作经历 <span class="num">[03]</span></h2>
                    <div class="timeline">
                        ${visibleItems.map(e => `
                        <div class="timeline-item">
                            <div class="timeline-date">${escHtml(e.date || '')}</div>
                            <div class="timeline-title">${escHtml(e.title || '')}</div>
                            <div class="timeline-company">@ ${escHtml(e.company || '')}</div>
                            <div class="timeline-desc">${escHtml(e.desc || '')}</div>
                        </div>
                        `).join('')}
                    </div>
                </div>`;
            }
        }

        // 页脚水印
        if (!forPDF) {
            html += `
            <div class="text-center mt-6" style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);letter-spacing:0.1em;">
                <span style="color:var(--neon-pink);">◤</span> GENERATED BY CYBER.RESUME.MAKER <span style="color:var(--neon-cyan);">◢</span>
            </div>`;
        }

        html += `</div>`;
        return html;
    }

    function formatBio(bio) {
        return escHtml(bio).split('\n').filter(p => p.trim()).map(p => `<p style="margin-bottom:8px;">${p}</p>`).join('');
    }

    function renderSocials(r) {
        const v = r.socials.visibility;
        const items = [];
        const platforms = {
            github: { label: 'GITHUB', icon: '◣' },
            twitter: { label: 'TWITTER', icon: '◤' },
            wechat: { label: 'WECHAT', icon: '◥' },
            linkedin: { label: 'LINKEDIN', icon: '◢' },
            bilibili: { label: 'BILIBILI', icon: '◈' }
        };
        Object.entries(platforms).forEach(([key, info]) => {
            if (v[key] && r.socials[key]) {
                items.push(`<a class="social-link" href="${isUrl(r.socials[key]) ? escAttr(r.socials[key]) : '#'}" target="_blank" rel="noopener">${info.icon} ${info.label}: ${escHtml(r.socials[key])}</a>`);
            } else if (r.socials[key]) {
                items.push(`<span class="social-link social-link--hidden" title="作者未公开此链接">▣ ${info.label} [已隐藏]</span>`);
            }
        });
        return `<div class="resume-socials">${items.join('')}</div>`;
    }

    function renderContactList(r) {
        const v = r.contact.visibility;
        const items = [];
        if (v.email && r.contact.email) items.push(`<div>✉ <a href="mailto:${escAttr(r.contact.email)}">${escHtml(r.contact.email)}</a></div>`);
        if (v.phone && r.contact.phone) items.push(`<div>☎ ${escHtml(r.contact.phone)}</div>`);
        if (v.website && r.contact.website) items.push(`<div>🌐 <a href="${escAttr(r.contact.website)}" target="_blank">${escHtml(r.contact.website)}</a></div>`);
        if (v.location && r.contact.location) items.push(`<div>📍 ${escHtml(r.contact.location)}</div>`);
        return items.join('');
    }

    function isUrl(s) {
        return /^https?:\/\//.test(s || '');
    }

    global.ResumeView = { render };
})(window);

/* ===== 公开简历页（路由目标） ===== */
(function (global) {
    'use strict';

    let currentResume = null;
    let scene = null;

    function render() {
        // 1. 尝试从 URL hash 取数
        const data = EncodeUtil.getHashData();
        if (data) {
            currentResume = data;
            currentResume.username = location.hash.match(/\/u\/([^&]+)/)?.[1] || currentResume.username;
        } else {
            // 2. 没有数据 → 错误页
            return errorPage();
        }

        // 应用主题
        if (currentResume.theme) {
            // 延迟到 onMount 中
        }

        // 主体内容（公开页给 hero 加 ElectricBorder）
        const innerHtml = ResumeView.render(currentResume, { mode: 'full', embedded: false, electricHero: true });

        return `<div class="page resume-page">${innerHtml}</div>`;
    }

    function errorPage() {
        return `
        <div class="page resume-page">
            <div class="resume-error">
                <div class="resume-error-icon glitch" data-text="404">404</div>
                <h2 class="resume-error-title">简历数据丢失</h2>
                <p class="resume-error-desc">该链接的简历数据无法解析。可能原因：链接不完整、数据已损坏、或者简历作者已重新生成链接。</p>
                <div class="flex gap-3 justify-center mt-6" style="flex-wrap:wrap;">
                    <a class="btn" href="#/">← 返回首页</a>
                    <a class="btn btn--pink" href="#/editor">+ 创建我的</a>
                </div>
            </div>
        </div>`;
    }

    function onMount() {
        if (!currentResume) return;
        if (currentResume.theme) {
            ThemeUtil.applyCustom(currentResume.theme);
        }
        if (global.ResumeScene) {
            scene = ResumeScene;
            scene.init();
        }

        // 头像/雷达渲染
        document.querySelectorAll('[data-avatar]').forEach(c => {
            if (global.AvatarGen) AvatarGen.render(c, parseInt(c.dataset.avatar));
        });
        const radar = document.querySelector('[data-radar-canvas]');
        if (radar && global.AvatarGen && currentResume.radar.list.length >= 3) {
            AvatarGen.renderRadar(radar, currentResume.radar.list);
        }

        // 联系信息揭示
        const revealBtn = document.getElementById('contact-reveal-btn');
        const revealContent = document.getElementById('contact-content');
        if (revealBtn && revealContent) {
            revealBtn.addEventListener('click', () => {
                revealContent.style.display = 'flex';
                revealBtn.style.display = 'none';
                if (AudioUtil) AudioUtil.SFX.success();
                if (global.CursorParticles) CursorParticles.burst(window.innerWidth / 2, 100, 20, [5, 217, 232]);
            });
        }

        // 浮动操作
        const pdfBtn = document.getElementById('btn-pdf-public');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => {
                if (global.Toast) Toast.show('正在生成 PDF...', 'success');
                exportPDFPublic();
            });
        }
        const copyBtn = document.getElementById('btn-copy-public');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const url = location.href;
                navigator.clipboard.writeText(url).then(() => {
                    if (global.Toast) Toast.show('已复制链接', 'success');
                    if (AudioUtil) AudioUtil.SFX.success();
                });
            });
        }
    }

    function onUnmount() {
        if (scene && scene.stop) scene.stop();
        if (global.ElectricBorderUtil) ElectricBorderUtil.destroy();
        // 恢复默认主题
        ThemeUtil.applyTheme('classic');
    }

    async function exportPDFPublic() {
        if (!global.html2pdf) return;
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:800px;background:' + (currentResume.theme?.bg || '#050510') + ';';
        container.innerHTML = ResumeView.render(currentResume, { mode: 'full', forPDF: true });
        document.body.appendChild(container);
        container.querySelectorAll('[data-avatar]').forEach(c => {
            if (global.AvatarGen) AvatarGen.render(c, parseInt(c.dataset.avatar));
        });
        const r = container.querySelector('[data-radar-canvas]');
        if (r && global.AvatarGen) AvatarGen.renderRadar(r, currentResume.radar.list);
        await new Promise(res => setTimeout(res, 200));
        try {
            await html2pdf().set({
                margin: 0,
                filename: `cyber-resume-${currentResume.username || 'public'}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, backgroundColor: currentResume.theme?.bg || '#050510' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(container).save();
            if (AudioUtil) AudioUtil.SFX.success();
        } catch (e) {
            if (global.Toast) Toast.show('PDF 生成失败：' + e.message, 'error');
        }
        document.body.removeChild(container);
    }

    global.ResumePage = { render, onMount, onUnmount };
})(window);
