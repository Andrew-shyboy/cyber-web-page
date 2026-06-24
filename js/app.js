/* ===== 主应用：路由、模态框、Toast ===== */
(function (global) {
    'use strict';

    // ========== 路由 ==========
    const ROUTES = [
        { path: /^\/?$/, page: 'landing' },
        { path: /^\/editor$/, page: 'editor' },
        { path: /^\/dashboard$/, page: 'dashboard' },
        { path: /^\/u\//, page: 'resume' }
    ];

    let currentPage = null;
    let currentModule = null;
    let scrollY = 0;

    function navigate(hash) {
        // 触发跳转
        if (location.hash !== hash) {
            location.hash = hash;
        } else {
            // 已经一致，强制重新解析
            handleRoute();
        }
    }

    function getRoute(path) {
        for (const r of ROUTES) {
            if (r.path.test(path)) return r.page;
        }
        return 'landing';
    }

    function handleRoute() {
        const hash = location.hash.replace(/^#/, '') || '/';
        const path = hash.split('?')[0];
        const route = getRoute(path);
        const moduleName = route.charAt(0).toUpperCase() + route.slice(1) + 'Page';
        const module = global[moduleName];

        if (!module) {
            console.error('Route module not found:', moduleName);
            return;
        }

        // 卸载当前页
        if (currentModule && currentModule.onUnmount) {
            currentModule.onUnmount();
        }

        // 滚动重置
        window.scrollTo(0, 0);
        document.querySelector('#app').style.opacity = '0';

        // 渲染新页
        setTimeout(() => {
            const app = document.getElementById('app');
            app.innerHTML = module.render();
            app.style.opacity = '1';
            currentPage = route;
            currentModule = module;
            if (module.onMount) module.onMount();

            // 顶部导航显隐
            if (route === 'resume') {
                document.getElementById('top-nav').classList.add('nav-hidden');
            } else {
                document.getElementById('top-nav').classList.remove('nav-hidden');
            }
        }, 150);
    }

    function initRouter() {
        window.addEventListener('hashchange', handleRoute);
        handleRoute();
    }

    // ========== 模态框 ==========
    function Modal() {}
    Modal.open = function (title, body, opts = {}) {
        const root = document.getElementById('modal-root');
        if (!root) return;
        root.innerHTML = `
            <div class="modal-backdrop" data-close></div>
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-title">${title}</div>
                    <button class="modal-close" data-close>×</button>
                </div>
                <div class="modal-body">${body}</div>
                ${opts.hideFooter ? '' : `
                <div class="modal-footer">
                    <button class="btn btn--sm btn--ghost" data-close>关闭</button>
                </div>`}
            </div>
        `;
        root.classList.add('active');
        // 绑定关闭
        root.querySelectorAll('[data-close]').forEach(el => {
            el.addEventListener('click', Modal.close);
        });
        if (AudioUtil) AudioUtil.SFX.open();
    };
    Modal.confirm = function (title, body, onConfirm) {
        const root = document.getElementById('modal-root');
        if (!root) return;
        root.innerHTML = `
            <div class="modal-backdrop" data-close></div>
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-title">${title}</div>
                    <button class="modal-close" data-close>×</button>
                </div>
                <div class="modal-body">${body}</div>
                <div class="modal-footer">
                    <button class="btn btn--sm btn--ghost" data-close>取消</button>
                    <button class="btn btn--sm btn--pink" id="modal-confirm-btn">确认</button>
                </div>
            </div>
        `;
        root.classList.add('active');
        root.querySelectorAll('[data-close]').forEach(el => {
            el.addEventListener('click', Modal.close);
        });
        document.getElementById('modal-confirm-btn').addEventListener('click', () => {
            Modal.close();
            if (onConfirm) onConfirm();
        });
        if (AudioUtil) AudioUtil.SFX.warn();
    };
    Modal.close = function () {
        const root = document.getElementById('modal-root');
        if (!root) return;
        root.classList.remove('active');
        setTimeout(() => { root.innerHTML = ''; }, 400);
        if (AudioUtil) AudioUtil.SFX.close();
    };

    // ========== Toast ==========
    const Toast = {};
    Toast.show = function (msg, type = 'info', duration = 4000) {
        const root = document.getElementById('toast-root');
        if (!root) return;
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = msg;
        root.appendChild(el);
        setTimeout(() => el.remove(), duration + 500);
        if (AudioUtil) AudioUtil.SFX.success();
    };

    // ========== 启动 ==========
    function boot() {
        // 注入示例数据（如果空）
        StorageUtil.ensureSeed();

        // 初始化工具
        CursorParticles.init();
        AudioUtil.init();

        // 全局拖拽 / 粘贴识别入口（全站任何页面可用）
        if (global.ImportUtil && ImportUtil.initDropZone) {
            ImportUtil.initDropZone();
        }

        // 路由
        initRouter();

        // 顶部导航点击
        document.querySelectorAll('[data-link]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                navigate('#' + el.dataset.link);
            });
        });

        // 链接平滑滚动
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href^="#"]');
            if (!a) return;
            const href = a.getAttribute('href');
            if (href === '#') return;
            if (href.startsWith('#/') || href.startsWith('#u')) {
                e.preventDefault();
                navigate(href);
            }
        });

        // 隐藏加载
        setTimeout(() => {
            const loader = document.getElementById('loader');
            if (loader) loader.classList.add('hidden');
        }, 800);

        // 全局键盘
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') Modal.close();
        });

        // 滚动隐藏/显示导航
        let lastScroll = 0;
        let navHidden = false;
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            if (currentPage === 'resume') return;
            const nav = document.getElementById('top-nav');
            if (!nav) return;
            if (y > lastScroll && y > 100 && !navHidden) {
                nav.classList.add('nav-hidden');
                navHidden = true;
            } else if (y < lastScroll && navHidden) {
                nav.classList.remove('nav-hidden');
                navHidden = false;
            }
            lastScroll = y;
        }, { passive: true });

        // 按钮 hover 音效
        document.addEventListener('mouseover', (e) => {
            const t = e.target.closest('.btn, .btn-icon, .theme-preset, .dash-tab, .preview-tab, .section-toggle');
            if (t && AudioUtil && AudioUtil.SFX) {
                // 简单节流
                if (!t.dataset.hoverTime || Date.now() - parseInt(t.dataset.hoverTime) > 100) {
                    t.dataset.hoverTime = Date.now();
                    AudioUtil.SFX.hover();
                }
            }
        });

        // 全局错误处理
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });
    }

    global.Modal = Modal;
    global.Toast = Toast;
    global.App = { navigate };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})(window);
