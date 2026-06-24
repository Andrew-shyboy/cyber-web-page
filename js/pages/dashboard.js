/* ===== 个人中心 Dashboard ===== */
(function (global) {
    'use strict';

    let currentTab = 'all';

    function render() {
        const stats = StorageUtil.getStats();
        const resumes = StorageUtil.loadAll();
        const archivedCount = resumes.filter(r => StorageUtil.isArchived(r)).length;

        return `
        <div class="page dashboard">
            <div class="dashboard-header">
                <div>
                    <h1 class="dashboard-title">个人中心</h1>
                    <div class="dashboard-subtitle">// MANAGE YOUR CYBER RESUMES //</div>
                </div>
                <div class="dashboard-actions">
                    <a class="btn btn--pink" href="#/editor">+ 新建简历</a>
                </div>
            </div>

            <div class="dashboard-stats">
                ${statBlock('TOTAL', stats.total, 'cyan')}
                ${statBlock('DRAFT', stats.draft, 'cyan')}
                ${statBlock('LOCAL', stats.local, 'pink')}
                ${statBlock('PUBLIC', stats.public, 'pink')}
            </div>

            <div class="dashboard-tabs">
                ${tabBtn('all', '全部', resumes.length)}
                ${tabBtn('draft', '草稿', stats.draft)}
                ${tabBtn('local', '本地', stats.local)}
                ${tabBtn('public', '已发布', stats.public)}
                ${tabBtn('archived', '已归档', archivedCount, 'archived')}
            </div>

            <div class="dashboard-grid" id="dash-grid">
                ${renderCards(resumes, currentTab)}
            </div>
        </div>
        `;
    }

    function tabBtn(tab, label, count, extraClass) {
        const cls = [
            'dash-tab',
            currentTab === tab ? 'active' : '',
            extraClass || ''
        ].filter(Boolean).join(' ');
        return `<button class="${cls}" data-tab="${tab}">${label} <span class="count">${count}</span></button>`;
    }

    function statBlock(label, value, color) {
        return `<div class="stat ${color === 'pink' ? 'stat--pink' : ''}">
            <div class="stat-value">${value.toString().padStart(2, '0')}</div>
            <div class="stat-label">// ${label}</div>
        </div>`;
    }

    function escAttr(s) { return (s || '').replace(/"/g, '&quot;'); }
    function escHtml(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function renderCards(list, tab) {
        if (tab === 'archived') {
            list = list.filter(r => StorageUtil.isArchived(r));
        } else if (tab !== 'all') {
            // 其它 tab 隐藏归档的简历，避免混淆
            list = list.filter(r => r.status === tab && !StorageUtil.isArchived(r));
        } else {
            // "全部" 也默认隐藏归档，归档的只在"已归档" tab 看到
            list = list.filter(r => !StorageUtil.isArchived(r));
        }
        if (!list.length) {
            const emptyMsg = tab === 'archived'
                ? '没有已归档的简历。'
                : (tab === 'all' ? '你还没有任何简历。点击下方按钮开始创建你的第一份赛博朋克简历。' : '此分类下没有简历。切换其他分类或新建一份。');
            return `
            <div class="empty-state">
                <div class="empty-state-icon">∅</div>
                <div class="empty-state-title">暂无简历</div>
                <div class="empty-state-desc">${emptyMsg}</div>
                <a class="btn btn--pink" href="#/editor">+ 创建简历</a>
            </div>`;
        }
        // 排序：updatedAt 降序
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        return list.map(r => cardItem(r)).join('');
    }

    function cardItem(r) {
        const archived = StorageUtil.isArchived(r);
        const importedFrom = r._importedFrom;
        const statusBadge = archived
            ? 'badge--archived'
            : (r.status === 'public' ? 'badge--public'
                : r.status === 'local' ? 'badge--local'
                : 'badge--draft');
        const statusText = archived
            ? '已归档'
            : (r.status === 'public' ? '已发布'
                : r.status === 'local' ? '本地'
                : '草稿');
        const time = archived && r._archivedAt
            ? '归档于 ' + FXUtil.formatTime(r._archivedAt)
            : FXUtil.formatTime(r.updatedAt);
        const importedTag = importedFrom
            ? `<div class="resume-card-imported" title="导入自 ${escAttr(importedFrom.fileName)}">
                <span class="glyph">⬇</span>
                <span class="src">${escHtml(importedFrom.fileName)}</span>
               </div>`
            : '';
        return `
        <div class="resume-card ${archived ? 'resume-card--archived' : ''}" data-resume-id="${r.id}">
            <div class="resume-card-head">
                <div class="resume-card-avatar">
                    <div class="avatar-frame">
                        <canvas data-avatar="${r.basic.avatarSeed}" width="80" height="80"></canvas>
                    </div>
                </div>
                <div class="resume-card-info">
                    <div class="resume-card-name">${escHtml(r.basic.name || '未命名')}</div>
                    <div class="resume-card-title">${escHtml(r.basic.title || '—')}</div>
                </div>
            </div>
            <div class="resume-card-meta">
                <span class="badge ${statusBadge}">${statusText}</span>
                <span class="tab-num">@${escHtml(r.username || r.id)}</span>
            </div>
            ${importedTag}
            <div class="resume-card-desc">${escHtml((r.basic.bio || '点击编辑按钮开始填写你的简历...').split('\n')[0].slice(0, 90))}${(r.basic.bio || '').length > 90 ? '...' : ''}</div>
            <div class="resume-card-footer">
                <div class="resume-card-time">${time}</div>
                <div class="resume-card-actions">
                    ${archived
                        ? `<button class="btn-icon btn-icon--cyan" data-act="restore" title="恢复为编辑草稿">
                            <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
                           </button>
                           <button class="btn-icon btn-icon--pink" data-act="delete" title="永久删除">
                            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                           </button>`
                        : `<button class="btn-icon" data-act="edit" title="编辑">
                            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                           </button>
                           ${r.status === 'public' ? `<button class="btn-icon" data-act="view" title="查看公开页">
                            <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                           </button>` : ''}
                           <button class="btn-icon" data-act="export" title="导出 JSON">
                            <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                           </button>
                           <button class="btn-icon btn-icon--pink" data-act="delete" title="删除">
                            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                           </button>`
                    }
                </div>
            </div>
        </div>`;
    }

    function onMount() {
        if (global.DashboardScene) DashboardScene.init();
        if (global.FXUtil) FXUtil.observeReveals();

        // 渲染头像
        renderAllAvatars();

        // 标签切换
        bindTabs();
        bindCards();

        // 菜单
        document.querySelectorAll('.nav-menu a').forEach(a => {
            a.classList.toggle('active', a.dataset.link === '/dashboard');
        });
    }

    function onUnmount() {
        if (global.DashboardScene) DashboardScene.stop();
        ThemeUtil.applyTheme('classic');
    }

    function bindTabs() {
        document.querySelectorAll('.dash-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                currentTab = tab.dataset.tab;
                // 重新渲染整页（tab 列表可能变）
                document.getElementById('app').innerHTML = render();
                if (global.DashboardScene) DashboardScene.init();
                renderAllAvatars();
                bindTabs();
                bindCards();
            });
        });
    }

    function renderAllAvatars() {
        document.querySelectorAll('[data-avatar]').forEach(c => {
            if (global.AvatarGen) AvatarGen.render(c, parseInt(c.dataset.avatar));
        });
    }

    function bindCards() {
        document.querySelectorAll('.resume-card').forEach(card => {
            const id = card.dataset.resumeId;
            card.addEventListener('click', (e) => {
                if (e.target.closest('[data-act]')) return;
                // 点击归档卡片 = 恢复并编辑
                const r = StorageUtil.getResume(id);
                if (!r) return;
                if (StorageUtil.isArchived(r)) {
                    StorageUtil.unarchive(id);
                }
                StorageUtil.setCurrent(r);
                location.hash = '#/editor';
                location.reload();
            });
        });

        document.querySelectorAll('[data-act]').forEach(btn => {
            const card = btn.closest('.resume-card');
            const id = card.dataset.resumeId;
            const act = btn.dataset.act;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const r = StorageUtil.getResume(id);
                if (!r) return;
                if (act === 'edit') {
                    StorageUtil.setCurrent(r);
                    location.hash = '#/editor';
                    location.reload();
                } else if (act === 'view') {
                    if (r.status === 'public') {
                        const url = EncodeUtil.buildResumeUrl(r.username, r);
                        window.open(url, '_blank');
                    }
                } else if (act === 'export') {
                    StorageUtil.exportJson(r);
                    if (AudioUtil) AudioUtil.SFX.success();
                    if (global.Toast) Toast.show('已导出 JSON', 'success');
                } else if (act === 'restore') {
                    StorageUtil.unarchive(id);
                    if (AudioUtil) AudioUtil.SFX.success();
                    if (global.Toast) Toast.show('已恢复，可点击进入编辑', 'success');
                    // 重新渲染整页
                    document.getElementById('app').innerHTML = render();
                    if (global.DashboardScene) DashboardScene.init();
                    renderAllAvatars();
                    bindTabs();
                    bindCards();
                } else if (act === 'delete') {
                    const isArchived = StorageUtil.isArchived(r);
                    const desc = isArchived
                        ? `<p>确定要<strong style="color:var(--neon-pink)">永久删除</strong>「<strong style="color:var(--neon-pink)">${escHtml(r.basic.name || '未命名')}</strong>」吗？</p><p style="color:var(--text-muted);font-size:12px;margin-top:8px;">此操作不可恢复。</p>`
                        : `<p>确定要删除「<strong style="color:var(--neon-pink)">${escHtml(r.basic.name || '未命名')}</strong>」吗？</p><p style="color:var(--text-muted);font-size:12px;margin-top:8px;">此操作不可恢复。</p>`;
                    if (global.Modal) {
                        Modal.confirm('删除简历', desc, () => {
                            StorageUtil.remove(id);
                            if (AudioUtil) AudioUtil.SFX.error();
                            if (global.Toast) Toast.show('已删除', 'success');
                            // 重新渲染整页
                            document.getElementById('app').innerHTML = render();
                            if (global.DashboardScene) DashboardScene.init();
                            renderAllAvatars();
                            bindTabs();
                            bindCards();
                        });
                    }
                }
            });
        });
    }

    global.DashboardPage = { render, onMount, onUnmount };
})(window);
