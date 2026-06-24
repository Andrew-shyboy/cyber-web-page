/* ===== 编辑器页面 ===== */
(function (global) {
    'use strict';

    let currentResume = null;
    let saveTimer = null;
    let activeSection = 'basic';

    function render() {
        // 加载或创建简历
        currentResume = StorageUtil.getCurrent() || StorageUtil.exampleResume();
        StorageUtil.setCurrent(currentResume);

        // 应用主题
        if (currentResume.theme) {
            ThemeUtil.applyCustom(currentResume.theme);
        }

        // AI 导入提示横幅（仅当刚刚识别填充过）
        const aiBanner = (currentResume._aiFilled && currentResume._aiFilled.length)
            ? `<div class="ai-import-banner" id="ai-banner">
                <span class="glyph">⚡</span>
                <div class="text">
                    <strong>AI 已自动识别 ${currentResume._aiFilled.length} 个字段</strong>
                    // 请检查并修改，标记 <span style="color:#05d9e8">AI</span> 的字段为系统填充
                </div>
                <button class="close" id="ai-banner-close" title="关闭">×</button>
            </div>`
            : '';

        return `
        <div class="page editor">
            <!-- 左侧：表单 -->
            <div class="editor-form">
                <div class="editor-header">
                    <div>
                        <h2>简历编辑器</h2>
                        <div class="status">// AUTO-SAVED</div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn--sm btn--ghost" id="btn-new">+ 新建</button>
                        <button class="btn btn--sm btn--ghost" id="btn-import">↑ 导入</button>
                        <input type="file" id="import-file" accept=".json,.txt,.md,.pdf,.docx" style="display:none;">
                    </div>
                </div>

                ${aiBanner}
                <div class="editor-drop-hint">
                    <div class="icon">⬇</div>
                    <div class="text">
                        <strong>拖拽简历文件 / Ctrl+V 粘贴</strong>
                        支持 JSON · TXT · MD · PDF · DOCX · 自动识别姓名、邮箱、技能、经历
                    </div>
                </div>

                <!-- 头像设置 -->
                <div class="editor-section">
                    <button class="section-toggle open" data-section="avatar">
                        <span>赛博头像</span>
                        <span class="count">[程序化生成]</span>
                    </button>
                    <div class="section-content">
                        <div class="avatar-edit">
                            <div class="avatar-frame">
                                <canvas id="avatar-canvas" width="160" height="160"></canvas>
                            </div>
                            <div class="info">
                                <strong>头像种子</strong>
                                <div>修改下方数字重新生成独一无二的几何头像。无需上传，保护隐私。</div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="field" style="margin-bottom:0;">
                                <label class="field-label">种子数</label>
                                <input type="number" class="input" id="f-avatar-seed" value="${currentResume.basic.avatarSeed}">
                            </div>
                            <div class="field" style="margin-bottom:0;">
                                <label class="field-label">&nbsp;</label>
                                <button class="btn btn--sm" id="btn-reroll-avatar">↻ 重新生成</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 基础信息 -->
                <div class="editor-section">
                    <button class="section-toggle open" data-section="basic">
                        <span>基础信息</span>
                        <span class="count">[${basicFieldsFilled()}/3]</span>
                    </button>
                    <div class="section-content">
                        <div class="field">
                            <label class="field-label">
                                <span>姓名 / ID</span>
                                <label class="field-toggle ${currentResume.basic.visibility.name ? 'on' : ''}">
                                    <input type="checkbox" data-vis-key="basic.visibility.name" ${currentResume.basic.visibility.name ? 'checked' : ''}>
                                    <span class="dot"></span>
                                    <span>${currentResume.basic.visibility.name ? '公开' : '隐藏'}</span>
                                </label>
                            </label>
                            <input type="text" class="input" id="f-name" placeholder="例如：林默 / ZERO" value="${escAttr(currentResume.basic.name)}">
                        </div>
                        <div class="field">
                            <label class="field-label">
                                <span>职位 / TITLE</span>
                                <label class="field-toggle ${currentResume.basic.visibility.title ? 'on' : ''}">
                                    <input type="checkbox" data-vis-key="basic.visibility.title" ${currentResume.basic.visibility.title ? 'checked' : ''}>
                                    <span class="dot"></span>
                                    <span>${currentResume.basic.visibility.title ? '公开' : '隐藏'}</span>
                                </label>
                            </label>
                            <input type="text" class="input" id="f-title" placeholder="例如：前端架构师" value="${escAttr(currentResume.basic.title)}">
                        </div>
                        <div class="field">
                            <label class="field-label">
                                <span>个人简介 / BIO</span>
                                <label class="field-toggle ${currentResume.basic.visibility.bio ? 'on' : ''}">
                                    <input type="checkbox" data-vis-key="basic.visibility.bio" ${currentResume.basic.visibility.bio ? 'checked' : ''}>
                                    <span class="dot"></span>
                                    <span>${currentResume.basic.visibility.bio ? '公开' : '隐藏'}</span>
                                </label>
                            </label>
                            <textarea class="textarea" id="f-bio" placeholder="用一段话介绍你自己...">${escHtml(currentResume.basic.bio)}</textarea>
                        </div>
                    </div>
                </div>

                <!-- 联系方式 -->
                <div class="editor-section">
                    <button class="section-toggle open" data-section="contact">
                        <span>联系方式</span>
                        <span class="count">[默认隐藏]</span>
                    </button>
                    <div class="section-content">
                        ${contactField('email', '邮箱', 'f-email', currentResume.contact.email)}
                        ${contactField('phone', '电话', 'f-phone', currentResume.contact.phone)}
                        ${contactField('website', '个人网站', 'f-website', currentResume.contact.website)}
                        ${contactField('location', '所在地', 'f-location', currentResume.contact.location)}
                    </div>
                </div>

                <!-- 社交链接 -->
                <div class="editor-section">
                    <button class="section-toggle open" data-section="socials">
                        <span>社交链接</span>
                        <span class="count">[可单独控制]</span>
                    </button>
                    <div class="section-content">
                        ${socialField('github', 'GitHub', 'https://github.com/xxx', currentResume.socials.github)}
                        ${socialField('twitter', 'Twitter / X', '@xxx', currentResume.socials.twitter)}
                        ${socialField('wechat', '微信号', '微信号', currentResume.socials.wechat)}
                        ${socialField('linkedin', 'LinkedIn', 'in/xxx', currentResume.socials.linkedin)}
                        ${socialField('bilibili', 'B站', 'space.bilibili.com/xxx', currentResume.socials.bilibili)}
                    </div>
                </div>

                <!-- 技能 -->
                <div class="editor-section">
                    <button class="section-toggle open" data-section="skills">
                        <span>技能</span>
                        <span class="count">[${currentResume.skills.list.length} 项]</span>
                    </button>
                    <div class="section-content">
                        <div class="field" style="margin-bottom:0;">
                            <label class="field-label">
                                <span>技能列表</span>
                                <label class="field-toggle ${currentResume.skills.visibility ? 'on' : ''}">
                                    <input type="checkbox" data-vis-key="skills.visibility" ${currentResume.skills.visibility ? 'checked' : ''}>
                                    <span class="dot"></span>
                                    <span>${currentResume.skills.visibility ? '公开' : '隐藏'}</span>
                                </label>
                            </label>
                            <div class="tag-input" id="tag-input">
                                ${currentResume.skills.list.map(s => tagItem(s)).join('')}
                                <input type="text" id="tag-input-field" placeholder="输入技能名 + Enter 添加">
                            </div>
                            <div class="text-dim mt-2" style="font-size:11px;">提示：每个技能都有 0-100 的熟练度，用 <code>@数字</code> 形式追加，例如 <code>React @90</code></div>
                        </div>
                    </div>
                </div>

                <!-- 能力雷达 -->
                <div class="editor-section">
                    <button class="section-toggle" data-section="radar">
                        <span>能力雷达</span>
                        <span class="count">[${currentResume.radar.list.length} 维]</span>
                    </button>
                    <div class="section-content collapsed">
                        <div class="field" style="margin-bottom:0;">
                            <label class="field-label">
                                <span>能力维度</span>
                                <label class="field-toggle ${currentResume.radar.visibility ? 'on' : ''}">
                                    <input type="checkbox" data-vis-key="radar.visibility" ${currentResume.radar.visibility ? 'checked' : ''}>
                                    <span class="dot"></span>
                                    <span>${currentResume.radar.visibility ? '公开' : '隐藏'}</span>
                                </label>
                            </label>
                            <div id="radar-list">
                                ${currentResume.radar.list.map((r, i) => radarItem(r, i)).join('')}
                            </div>
                            <button class="btn btn--sm mt-4" id="btn-add-radar">+ 添加维度</button>
                        </div>
                    </div>
                </div>

                <!-- 经历 -->
                <div class="editor-section">
                    <button class="section-toggle" data-section="experience">
                        <span>工作/项目经历</span>
                        <span class="count">[${currentResume.experience.list.length} 条]</span>
                    </button>
                    <div class="section-content collapsed">
                        <div class="field" style="margin-bottom:0;">
                            <label class="field-label">
                                <span>经历列表</span>
                                <label class="field-toggle ${currentResume.experience.visibility ? 'on' : ''}">
                                    <input type="checkbox" data-vis-key="experience.visibility" ${currentResume.experience.visibility ? 'checked' : ''}>
                                    <span class="dot"></span>
                                    <span>${currentResume.experience.visibility ? '公开' : '隐藏'}</span>
                                </label>
                            </label>
                            <div id="exp-list">
                                ${currentResume.experience.list.map((e, i) => experienceItem(e, i)).join('')}
                            </div>
                            <button class="btn btn--sm mt-4" id="btn-add-exp">+ 添加经历</button>
                        </div>
                    </div>
                </div>

                <!-- 主题 -->
                <div class="editor-section">
                    <button class="section-toggle" data-section="theme">
                        <span>主题定制</span>
                        <span class="count">[${currentResume.theme.preset}]</span>
                    </button>
                    <div class="section-content collapsed">
                        <div class="field-label mb-2">预设主题</div>
                        <div class="theme-presets" id="theme-presets">
                            ${themePresets()}
                        </div>
                        <div class="divider"></div>
                        <div class="field-label mb-2">自由调色</div>
                        <div class="theme-editor">
                            <div class="color-picker">
                                <label>主色</label>
                                <input type="color" id="f-color-primary" value="${currentResume.theme.primary}">
                            </div>
                            <div class="color-picker">
                                <label>强调色</label>
                                <input type="color" id="f-color-secondary" value="${currentResume.theme.secondary}">
                            </div>
                            <div class="color-picker">
                                <label>背景色</label>
                                <input type="color" id="f-color-bg" value="${currentResume.theme.bg}">
                            </div>
                            <button class="btn btn--sm btn--ghost" id="btn-reset-theme">↻ 重置</button>
                        </div>
                    </div>
                </div>

                <!-- 操作 -->
                <div class="editor-actions">
                    <button class="btn btn--pink" id="btn-publish">▶ 一键发布</button>
                    <button class="btn" id="btn-save-local">💾 仅本地保存</button>
                    <button class="btn btn--ghost" id="btn-export-pdf">📄 导出 PDF</button>
                    <button class="btn btn--ghost" id="btn-export-json">↓ 导出 JSON</button>
                </div>
            </div>

            <!-- 右侧：预览 -->
            <div class="editor-preview">
                <div class="preview-header">
                    <h3>实时预览</h3>
                    <div class="preview-tabs">
                        <button class="preview-tab active" data-preview="full">完整</button>
                        <button class="preview-tab" data-preview="desktop">桌面</button>
                        <button class="preview-tab" data-preview="mobile">移动</button>
                    </div>
                </div>
                <div class="preview-stage" id="preview-stage">
                    <div id="preview-content"></div>
                </div>
            </div>
        </div>
        `;
    }

    function escAttr(s) { return (s || '').replace(/"/g, '&quot;'); }
    function escHtml(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function contactField(key, label, id, value) {
        const visible = currentResume.contact.visibility[key];
        return `
        <div class="field" style="margin-bottom:12px;">
            <label class="field-label">
                <span>${label}</span>
                <label class="field-toggle ${visible ? 'on' : ''}">
                    <input type="checkbox" data-vis-key="contact.visibility.${key}" ${visible ? 'checked' : ''}>
                    <span class="dot"></span>
                    <span>${visible ? '公开' : '隐藏'}</span>
                </label>
            </label>
            <input type="text" class="input" id="${id}" placeholder="${label}" value="${escAttr(value)}">
        </div>`;
    }

    function socialField(key, label, placeholder, value) {
        const visible = currentResume.socials.visibility[key];
        return `
        <div class="field" style="margin-bottom:12px;">
            <label class="field-label">
                <span>${label}</span>
                <label class="field-toggle ${visible ? 'on' : ''}">
                    <input type="checkbox" data-vis-key="socials.visibility.${key}" ${visible ? 'checked' : ''}>
                    <span class="dot"></span>
                    <span>${visible ? '公开' : '隐藏'}</span>
                </label>
            </label>
            <input type="text" class="input" id="f-social-${key}" placeholder="${placeholder}" value="${escAttr(value)}">
        </div>`;
    }

    function tagItem(s) {
        return `<span class="tag">${escHtml(s.name)}<span style="color:var(--text-muted);font-size:10px;margin-left:4px;">@${s.level}</span><span class="remove" data-remove-tag="${escAttr(s.name)}">×</span></span>`;
    }

    function radarItem(r, i) {
        return `
        <div class="exp-item" data-radar-i="${i}">
            <div class="item-num">#${String(i + 1).padStart(2, '0')}</div>
            <div class="row">
                <div class="field" style="margin-bottom:8px;">
                    <label class="field-label"><span>能力</span></label>
                    <input type="text" class="input radar-name" value="${escAttr(r.name)}">
                </div>
                <div class="field" style="margin-bottom:8px;">
                    <label class="field-label"><span>数值 (0-100)</span></label>
                    <input type="number" min="0" max="100" class="input radar-value" value="${r.value}">
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-icon btn-icon--pink" data-remove-radar="${i}" title="删除">×</button>
            </div>
        </div>`;
    }

    function experienceItem(e, i) {
        return `
        <div class="exp-item" data-exp-i="${i}">
            <div class="item-num">#${String(i + 1).padStart(2, '0')}</div>
            <div class="row">
                <div class="field" style="margin-bottom:8px;">
                    <label class="field-label"><span>职位</span></label>
                    <input type="text" class="input exp-title" value="${escAttr(e.title)}">
                </div>
                <div class="field" style="margin-bottom:8px;">
                    <label class="field-label"><span>公司</span></label>
                    <input type="text" class="input exp-company" value="${escAttr(e.company)}">
                </div>
            </div>
            <div class="field" style="margin-bottom:8px;">
                <label class="field-label"><span>时间</span></label>
                <input type="text" class="input exp-date" placeholder="2024.01 - 至今" value="${escAttr(e.date)}">
            </div>
            <div class="field" style="margin-bottom:8px;">
                <label class="field-label"><span>描述</span></label>
                <textarea class="textarea exp-desc" rows="2">${escHtml(e.desc)}</textarea>
            </div>
            <div class="item-actions">
                <label class="field-toggle ${e.visible !== false ? 'on' : ''}" style="font-size:10px;">
                    <input type="checkbox" class="exp-visible" ${e.visible !== false ? 'checked' : ''}>
                    <span class="dot"></span>
                    <span>${e.visible !== false ? '可见' : '隐藏'}</span>
                </label>
                <button class="btn-icon btn-icon--pink" data-remove-exp="${i}" title="删除">×</button>
            </div>
        </div>`;
    }

    function themePresets() {
        const presets = ThemeUtil.listPresets();
        return Object.entries(presets).map(([k, v]) =>
            `<button class="theme-preset ${k === currentResume.theme.preset ? 'active' : ''}" data-preset="${k}">${v.name}</button>`
        ).join('');
    }

    function basicFieldsFilled() {
        let n = 0;
        if (currentResume.basic.name) n++;
        if (currentResume.basic.title) n++;
        if (currentResume.basic.bio) n++;
        return n;
    }

    function onMount() {
        if (global.EditorScene) EditorScene.init();
        if (global.FXUtil) FXUtil.observeReveals();

        // 渲染头像
        renderAvatar();

        // 渲染预览
        renderPreview();

        // AI 填充高亮（如果当前简历是 AI 填充的）
        applyAIHighlight();

        // 关闭 AI 横幅
        const closeBtn = document.getElementById('ai-banner-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const b = document.getElementById('ai-banner');
                if (b) b.remove();
            });
        }

        // 用户开始编辑时清除 AI 标记（任何字段 focus/input 都会触发）
        const clearAIOnEdit = () => {
            document.querySelectorAll('.field-ai').forEach(el => el.classList.remove('field-ai'));
            const banner = document.getElementById('ai-banner');
            if (banner) banner.remove();
            // 同步清除 _aiFilled 标记，避免下次进入重复高亮
            // 保留 _importedFrom / _archivedAt 以便 dashboard 展示
            if (currentResume && currentResume._aiFilled) {
                delete currentResume._aiFilled;
                StorageUtil.upsert(currentResume);
            }
        };
        // 用 once 模式，第一次编辑后即失效
        document.getElementById('app').addEventListener('input', clearAIOnEdit, { once: true, capture: true });
        document.getElementById('app').addEventListener('focusin', (e) => {
            if (e.target.matches('input,textarea,select')) {
                const t = e.target.closest('.field-ai');
                if (t) t.classList.remove('field-ai');
            }
        }, { capture: true });

        // 绑定事件
        bindEvents();
    }

    function applyAIHighlight() {
        const filled = (currentResume && currentResume._aiFilled) || [];
        if (!filled.length) return;
        filled.forEach(path => {
            // path: 'basic.name' / 'contact.email' / 'skills.list' / 'experience.list'
            if (path === 'basic.name') tagField('f-name');
            else if (path === 'basic.title') tagField('f-title');
            else if (path === 'basic.bio') tagField('f-bio');
            else if (path === 'contact.email') tagField('f-email');
            else if (path === 'contact.phone') tagField('f-phone');
            else if (path === 'contact.website') tagField('f-website');
            else if (path === 'contact.location') tagField('f-location');
            else if (path === 'socials.github') tagField('f-github');
            else if (path === 'socials.twitter') tagField('f-twitter');
            else if (path === 'socials.wechat') tagField('f-wechat');
            else if (path === 'socials.linkedin') tagField('f-linkedin');
            else if (path === 'socials.bilibili') tagField('f-bilibili');
            else if (path === 'skills.list') {
                const sec = document.querySelector('[data-section="skills"]');
                if (sec) (sec.closest('.editor-section') || sec).classList.add('field-ai');
            }
            else if (path === 'experience.list') {
                const sec = document.querySelector('[data-section="experience"]');
                if (sec) (sec.closest('.editor-section') || sec).classList.add('field-ai');
            }
        });
    }

    function tagField(id) {
        const el = document.getElementById(id);
        if (!el) return;
        // 找最近的 form-field 容器
        const container = el.closest('.form-field') || el.parentElement;
        if (container) container.classList.add('field-ai');
        else el.classList.add('field-ai');
    }

    function onUnmount() {
        if (global.EditorScene) EditorScene.stop();
        if (saveTimer) clearTimeout(saveTimer);
        // 恢复默认主题
        ThemeUtil.applyTheme('classic');
    }

    function bindEvents() {
        // Section 折叠
        document.querySelectorAll('.section-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const content = btn.nextElementSibling;
                const isOpen = btn.classList.contains('open');
                if (isOpen) {
                    btn.classList.remove('open');
                    content.classList.add('collapsed');
                } else {
                    btn.classList.add('open');
                    content.classList.remove('collapsed');
                }
                if (AudioUtil && AudioUtil.SFX) AudioUtil.SFX.click();
            });
        });

        // 字段可见性切换
        document.querySelectorAll('[data-vis-key]').forEach(toggle => {
            const input = toggle.querySelector('input[type="checkbox"]');
            if (!input) return;
            input.addEventListener('change', () => {
                const key = toggle.dataset.visKey;
                setDeep(currentResume, key, input.checked);
                toggle.classList.toggle('on', input.checked);
                const span = toggle.querySelector('span:last-child');
                if (span) span.textContent = input.checked ? '公开' : '隐藏';
                if (AudioUtil) AudioUtil.SFX.click();
                scheduleSave();
                renderPreview();
            });
        });

        // 基础信息输入
        const bindField = (id, key) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', () => {
                setDeep(currentResume, key, el.value);
                if (AudioUtil) AudioUtil.SFX.type();
                scheduleSave();
                renderPreview();
            });
        };
        bindField('f-name', 'basic.name');
        bindField('f-title', 'basic.title');
        bindField('f-bio', 'basic.bio');
        bindField('f-email', 'contact.email');
        bindField('f-phone', 'contact.phone');
        bindField('f-website', 'contact.website');
        bindField('f-location', 'contact.location');
        ['github', 'twitter', 'wechat', 'linkedin', 'bilibili'].forEach(k => {
            bindField(`f-social-${k}`, `socials.${k}`);
        });

        // 头像种子
        const seedEl = document.getElementById('f-avatar-seed');
        if (seedEl) {
            seedEl.addEventListener('input', () => {
                currentResume.basic.avatarSeed = parseInt(seedEl.value) || 0;
                renderAvatar();
                renderPreview();
                scheduleSave();
            });
        }
        const rerollBtn = document.getElementById('btn-reroll-avatar');
        if (rerollBtn) {
            rerollBtn.addEventListener('click', () => {
                currentResume.basic.avatarSeed = Math.floor(Math.random() * 100000);
                if (seedEl) seedEl.value = currentResume.basic.avatarSeed;
                renderAvatar();
                renderPreview();
                scheduleSave();
                if (AudioUtil) AudioUtil.SFX.success();
            });
        }

        // 技能标签
        bindTagInput();

        // 雷达
        bindRadarList();

        // 经历
        bindExperienceList();

        // 主题预设
        document.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                const t = ThemeUtil.getPreset(preset);
                if (!t) return;
                currentResume.theme = { preset, primary: t.primary, secondary: t.secondary, bg: t.bg };
                ThemeUtil.applyCustom(currentResume.theme);
                // 更新按钮
                document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // 更新颜色选择器
                document.getElementById('f-color-primary').value = t.primary;
                document.getElementById('f-color-secondary').value = t.secondary;
                document.getElementById('f-color-bg').value = t.bg;
                if (AudioUtil) AudioUtil.SFX.success();
                scheduleSave();
                renderPreview();
            });
        });

        // 颜色选择器
        const colorBind = (id, key) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', () => {
                currentResume.theme[key] = el.value;
                currentResume.theme.preset = 'custom';
                ThemeUtil.applyCustom(currentResume.theme);
                // 取消预设激活
                document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
                if (AudioUtil) AudioUtil.SFX.click();
                scheduleSave();
                renderPreview();
            });
        };
        colorBind('f-color-primary', 'primary');
        colorBind('f-color-secondary', 'secondary');
        colorBind('f-color-bg', 'bg');

        // 重置主题
        const resetTheme = document.getElementById('btn-reset-theme');
        if (resetTheme) {
            resetTheme.addEventListener('click', () => {
                currentResume.theme = { preset: 'classic', primary: '#ff2a6d', secondary: '#05d9e8', bg: '#050510' };
                ThemeUtil.applyCustom(currentResume.theme);
                document.querySelectorAll('[data-preset]').forEach(b => b.classList.toggle('active', b.dataset.preset === 'classic'));
                document.getElementById('f-color-primary').value = '#ff2a6d';
                document.getElementById('f-color-secondary').value = '#05d9e8';
                document.getElementById('f-color-bg').value = '#050510';
                if (AudioUtil) AudioUtil.SFX.success();
                scheduleSave();
                renderPreview();
            });
        }

        // 发布
        const pubBtn = document.getElementById('btn-publish');
        if (pubBtn) pubBtn.addEventListener('click', handlePublish);

        // 本地保存
        const localBtn = document.getElementById('btn-save-local');
        if (localBtn) localBtn.addEventListener('click', () => {
            currentResume.status = 'local';
            StorageUtil.upsert(currentResume);
            if (AudioUtil) AudioUtil.SFX.success();
            if (global.Toast) Toast.show('已保存到本地，不发布上线', 'success');
        });

        // 导出 PDF
        const pdfBtn = document.getElementById('btn-export-pdf');
        if (pdfBtn) pdfBtn.addEventListener('click', () => exportPDF());

        // 导出 JSON
        const jsonBtn = document.getElementById('btn-export-json');
        if (jsonBtn) jsonBtn.addEventListener('click', () => {
            StorageUtil.exportJson(currentResume);
            if (AudioUtil) AudioUtil.SFX.success();
        });

        // 新建（先归档当前，再创建空白）
        const newBtn = document.getElementById('btn-new');
        if (newBtn) newBtn.addEventListener('click', () => {
            const doNew = () => {
                // 强制保存未保存修改 + 归档当前草稿（不动 updatedAt）
                forceSave();
                const currentId = StorageUtil.getCurrentId();
                if (currentId) {
                    const cur = StorageUtil.getResume(currentId);
                    if (cur && !cur._importedFrom && !cur._archivedAt) {
                        StorageUtil.archive(currentId);
                    }
                }
                // 创建空白
                const r = StorageUtil.emptyResume();
                r.basic.avatarSeed = Math.floor(Math.random() * 100000);
                StorageUtil.setCurrent(r);
                if (global.App && global.App.navigate) {
                    global.App.navigate('#/editor');
                } else {
                    location.hash = '#/editor';
                }
            };

            if (global.Modal) {
                Modal.confirm('新建简历', '确定要新建一份简历吗？当前编辑的草稿会自动归档到个人中心。', () => {
                    doNew();
                });
            } else {
                doNew();
            }
        });

        // 导入（走全局流程：解析 → 动画 → 跳转 → 填充）
        const impBtn = document.getElementById('btn-import');
        const impFile = document.getElementById('import-file');
        if (impBtn && impFile) {
            impBtn.addEventListener('click', () => impFile.click());
            impFile.addEventListener('change', (e) => {
                const f = e.target.files[0];
                if (!f) return;
                e.target.value = '';
                if (global.ImportUtil) {
                    ImportUtil.runFullImportFlow(f);
                } else {
                    if (global.Toast) Toast.show('❌ 导入模块未加载', 'error');
                }
            });
        }

        // 预览模式
        document.querySelectorAll('.preview-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const mode = tab.dataset.preview;
                renderPreview(mode);
            });
        });
    }

    function bindTagInput() {
        const input = document.getElementById('tag-input-field');
        const container = document.getElementById('tag-input');
        if (!input || !container) return;

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                e.preventDefault();
                const v = input.value.trim();
                let name = v, level = 70;
                const m = v.match(/^(.+?)\s*@(\d+)$/);
                if (m) { name = m[1].trim(); level = Math.min(100, Math.max(0, parseInt(m[2]))); }
                if (name) {
                    currentResume.skills.list.push({ name, level });
                    input.value = '';
                    refreshTagUI();
                    scheduleSave();
                    renderPreview();
                    if (AudioUtil) AudioUtil.SFX.click();
                }
            } else if (e.key === 'Backspace' && !input.value && currentResume.skills.list.length) {
                currentResume.skills.list.pop();
                refreshTagUI();
                scheduleSave();
                renderPreview();
            }
        });

        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove')) {
                const name = e.target.dataset.removeTag;
                currentResume.skills.list = currentResume.skills.list.filter(s => s.name !== name);
                refreshTagUI();
                scheduleSave();
                renderPreview();
            }
        });
    }

    function refreshTagUI() {
        const container = document.getElementById('tag-input');
        if (!container) return;
        const existingInput = document.getElementById('tag-input-field');
        container.innerHTML = currentResume.skills.list.map(s => tagItem(s)).join('') + existingInput.outerHTML;
        bindTagInput();
    }

    function bindRadarList() {
        const list = document.getElementById('radar-list');
        if (!list) return;

        list.addEventListener('input', (e) => {
            const item = e.target.closest('[data-radar-i]');
            if (!item) return;
            const i = parseInt(item.dataset.radarI);
            if (e.target.classList.contains('radar-name')) currentResume.radar.list[i].name = e.target.value;
            if (e.target.classList.contains('radar-value')) currentResume.radar.list[i].value = parseInt(e.target.value) || 0;
            scheduleSave();
            renderPreview();
        });

        list.addEventListener('click', (e) => {
            if (e.target.closest('[data-remove-radar]')) {
                const i = parseInt(e.target.closest('[data-remove-radar]').dataset.removeRadar);
                currentResume.radar.list.splice(i, 1);
                list.innerHTML = currentResume.radar.list.map((r, i) => radarItem(r, i)).join('');
                scheduleSave();
                renderPreview();
            }
        });

        const addBtn = document.getElementById('btn-add-radar');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                currentResume.radar.list.push({ name: '新能力', value: 50 });
                list.insertAdjacentHTML('beforeend', radarItem(currentResume.radar.list[currentResume.radar.list.length - 1], currentResume.radar.list.length - 1));
                scheduleSave();
                renderPreview();
            });
        }
    }

    function bindExperienceList() {
        const list = document.getElementById('exp-list');
        if (!list) return;

        list.addEventListener('input', (e) => {
            const item = e.target.closest('[data-exp-i]');
            if (!item) return;
            const i = parseInt(item.dataset.expI);
            const t = e.target;
            if (t.classList.contains('exp-title')) currentResume.experience.list[i].title = t.value;
            if (t.classList.contains('exp-company')) currentResume.experience.list[i].company = t.value;
            if (t.classList.contains('exp-date')) currentResume.experience.list[i].date = t.value;
            if (t.classList.contains('exp-desc')) currentResume.experience.list[i].desc = t.value;
            scheduleSave();
            renderPreview();
        });

        list.addEventListener('change', (e) => {
            const item = e.target.closest('[data-exp-i]');
            if (!item) return;
            if (e.target.classList.contains('exp-visible')) {
                const i = parseInt(item.dataset.expI);
                currentResume.experience.list[i].visible = e.target.checked;
                const toggle = e.target.closest('.field-toggle');
                toggle.classList.toggle('on', e.target.checked);
                const span = toggle.querySelector('span:last-child');
                if (span) span.textContent = e.target.checked ? '可见' : '隐藏';
                scheduleSave();
                renderPreview();
            }
        });

        list.addEventListener('click', (e) => {
            if (e.target.closest('[data-remove-exp]')) {
                const i = parseInt(e.target.closest('[data-remove-exp]').dataset.removeExp);
                currentResume.experience.list.splice(i, 1);
                list.innerHTML = currentResume.experience.list.map((e, i) => experienceItem(e, i)).join('');
                scheduleSave();
                renderPreview();
            }
        });

        const addBtn = document.getElementById('btn-add-exp');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                currentResume.experience.list.push({ title: '新职位', company: '新公司', date: '2024.01 - 至今', desc: '', visible: true });
                const i = currentResume.experience.list.length - 1;
                list.insertAdjacentHTML('beforeend', experienceItem(currentResume.experience.list[i], i));
                scheduleSave();
                renderPreview();
            });
        }
    }

    function renderAvatar() {
        const canvas = document.getElementById('avatar-canvas');
        if (!canvas || !global.AvatarGen) return;
        AvatarGen.render(canvas, currentResume.basic.avatarSeed);
    }

    function renderPreview(mode) {
        const target = document.getElementById('preview-content');
        if (!target || !global.ResumeView) return;
        if (!mode) {
            const activeTab = document.querySelector('.preview-tab.active');
            mode = activeTab ? activeTab.dataset.preview : 'full';
        }
        target.innerHTML = ResumeView.render(currentResume, { mode, embedded: true });
        // 重新渲染头像
        target.querySelectorAll('[data-avatar]').forEach(c => {
            if (global.AvatarGen) AvatarGen.render(c, parseInt(c.dataset.avatar));
        });
        // 渲染雷达图
        const radarCanvas = target.querySelector('[data-radar-canvas]');
        if (radarCanvas && global.AvatarGen) AvatarGen.renderRadar(radarCanvas, currentResume.radar.list);
    }

    function scheduleSave() {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            currentResume.status = currentResume.status || 'draft';
            StorageUtil.upsert(currentResume);
        }, 300);
    }

    function setDeep(obj, path, value) {
        const parts = path.split('.');
        let o = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!o[parts[i]]) o[parts[i]] = {};
            o = o[parts[i]];
        }
        o[parts[parts.length - 1]] = value;
    }

    function handlePublish() {
        // 校验
        if (!currentResume.basic.name) {
            if (global.Toast) Toast.show('请先填写姓名', 'error');
            if (AudioUtil) AudioUtil.SFX.error();
            return;
        }

        // 设置用户名
        const username = (currentResume.username || currentResume.basic.name).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20) || EncodeUtil.genId(6);
        currentResume.username = username;

        // 弹窗确认
        const visibleFields = [];
        if (currentResume.contact.visibility.email) visibleFields.push('邮箱');
        if (currentResume.contact.visibility.phone) visibleFields.push('电话');
        if (currentResume.contact.visibility.website) visibleFields.push('网站');
        if (currentResume.contact.visibility.location) visibleFields.push('所在地');
        Object.entries(currentResume.socials.visibility || {}).forEach(([k, v]) => {
            if (v && currentResume.socials[k]) visibleFields.push(k);
        });

        const desc = `
            <p>简历将生成一个<strong style="color:var(--neon-cyan)">公开的 URL</strong>，任何拿到链接的人都能查看。</p>
            <p>用户名：<code style="color:var(--neon-cyan)">${escHtml(username)}</code></p>
            <p style="margin-top:12px;">将公开以下信息：</p>
            <ul style="margin-top:8px;padding-left:20px;color:var(--text-secondary);">
                <li>基础信息（姓名/职位/简介）</li>
                <li>技能${currentResume.skills.visibility ? ' ✓' : ' ✗'}</li>
                <li>能力雷达${currentResume.radar.visibility ? ' ✓' : ' ✗'}</li>
                <li>工作经历${currentResume.experience.visibility ? ' ✓' : ' ✗'}</li>
                ${visibleFields.length ? '<li>联系方式：' + visibleFields.join('、') + '</li>' : '<li>联系方式：默认隐藏</li>'}
            </ul>
            <p style="margin-top:12px;color:var(--text-muted);font-size:12px;">💡 提示：联系方式默认隐藏，访客需点击「查看联系方式」按钮才能看到。</p>
        `;

        if (global.Modal) {
            Modal.confirm('确认发布？', desc, () => {
                currentResume.status = 'public';
                StorageUtil.upsert(currentResume);
                const url = EncodeUtil.buildResumeUrl(username, currentResume);
                if (AudioUtil) AudioUtil.SFX.success();
                showPublishResult(url);
            });
        }
    }

    function showPublishResult(url) {
        const body = `
            <p>你的赛博朋克个人主页已发布！</p>
            <div style="margin:16px 0;padding:12px;background:rgba(5,5,16,0.6);border:1px solid var(--neon-cyan);word-break:break-all;font-family:var(--font-mono);font-size:12px;color:var(--neon-cyan);" id="publish-url">${url}</div>
            <div class="flex gap-2 mt-4" style="flex-wrap:wrap;">
                <button class="btn btn--sm" id="btn-copy-url">📋 复制链接</button>
                <a class="btn btn--sm btn--pink" href="${url}" target="_blank">↗ 打开</a>
                <a class="btn btn--sm btn--ghost" href="#/dashboard">📁 我的简历</a>
            </div>
        `;
        if (global.Modal) {
            Modal.open('🎉 发布成功', body, { hideFooter: true });
            setTimeout(() => {
                const c = document.getElementById('btn-copy-url');
                if (c) c.addEventListener('click', () => {
                    navigator.clipboard.writeText(url).then(() => {
                        if (global.Toast) Toast.show('已复制到剪贴板', 'success');
                        if (AudioUtil) AudioUtil.SFX.success();
                    });
                });
            }, 100);
        }
    }

    async function exportPDF() {
        if (!global.ResumeView) return;
        const html = ResumeView.render(currentResume, { mode: 'full', forPDF: true });
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:800px;background:' + currentResume.theme.bg + ';';
        container.innerHTML = html;
        document.body.appendChild(container);

        // 渲染头像
        container.querySelectorAll('[data-avatar]').forEach(c => {
            if (global.AvatarGen) AvatarGen.render(c, parseInt(c.dataset.avatar));
        });
        const radarCanvas = container.querySelector('[data-radar-canvas]');
        if (radarCanvas && global.AvatarGen) AvatarGen.renderRadar(radarCanvas, currentResume.radar.list);

        // 等一会让 canvas 渲染
        await new Promise(r => setTimeout(r, 200));

        if (global.html2pdf) {
            try {
                if (global.Toast) Toast.show('正在生成 PDF...', 'success');
                await html2pdf().set({
                    margin: 0,
                    filename: `cyber-resume-${currentResume.username || currentResume.id}.pdf`,
                    image: { type: 'jpeg', quality: 0.95 },
                    html2canvas: { scale: 2, backgroundColor: currentResume.theme.bg },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                }).from(container).save();
                if (AudioUtil) AudioUtil.SFX.success();
                if (global.Toast) Toast.show('PDF 已下载', 'success');
            } catch (e) {
                if (global.Toast) Toast.show('PDF 生成失败：' + e.message, 'error');
            }
        }
        document.body.removeChild(container);
    }

    function forceSave() {
        if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
        if (currentResume) {
            currentResume.status = currentResume.status || 'draft';
            StorageUtil.upsert(currentResume);
        }
    }

    global.EditorPage = { render, onMount, onUnmount, forceSave };
})(window);
