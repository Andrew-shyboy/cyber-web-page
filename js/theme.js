/* ===== 主题切换 ===== */
(function (global) {
    'use strict';

    const PRESETS = {
        classic: { name: '经典霓虹', primary: '#ff2a6d', secondary: '#05d9e8', bg: '#050510' },
        matrix: { name: '矩阵绿', primary: '#39ff14', secondary: '#00ff9d', bg: '#000a00' },
        sunset: { name: '赛博日落', primary: '#ff6b35', secondary: '#ffb627', bg: '#1a0a05' },
        ghost: { name: '幽灵灰', primary: '#ffffff', secondary: '#cccccc', bg: '#0a0a0a' },
        void: { name: '虚空紫', primary: '#b026ff', secondary: '#5577ff', bg: '#08000f' },
        hazard: { name: '危险黄', primary: '#ff073a', secondary: '#ffe600', bg: '#0f0500' }
    };

    function applyTheme(theme) {
        const t = typeof theme === 'string' ? PRESETS[theme] : theme;
        if (!t) return;
        const root = document.documentElement;
        root.style.setProperty('--neon-pink', t.primary);
        root.style.setProperty('--neon-cyan', t.secondary);
        root.style.setProperty('--bg-base', t.bg);
    }

    function applyCustom(theme) {
        // 自由调色版
        if (!theme) return;
        const root = document.documentElement;
        if (theme.primary) root.style.setProperty('--neon-pink', theme.primary);
        if (theme.secondary) root.style.setProperty('--neon-cyan', theme.secondary);
        if (theme.bg) root.style.setProperty('--bg-base', theme.bg);
    }

    function getPreset(name) {
        return PRESETS[name];
    }
    function listPresets() {
        return PRESETS;
    }

    global.ThemeUtil = {
        PRESETS,
        applyTheme,
        applyCustom,
        getPreset,
        listPresets
    };
})(window);
