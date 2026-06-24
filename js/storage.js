/* ===== 存储管理：LocalStorage ===== */
(function (global) {
    'use strict';

    const KEYS = {
        RESUMES: 'cyber.resumes',
        SETTINGS: 'cyber.settings',
        CURRENT: 'cyber.currentId',
        PUBLISHED: 'cyber.published'
    };

    // 完整简历数据结构
    function emptyResume() {
        return {
            id: EncodeUtil.genId(8),
            status: 'draft', // draft / local / public
            createdAt: Date.now(),
            updatedAt: Date.now(),
            username: '',
            basic: {
                name: '',
                title: '',
                bio: '',
                avatarSeed: Math.floor(Math.random() * 100000),
                visibility: { name: true, title: true, bio: true }
            },
            contact: {
                email: '',
                phone: '',
                website: '',
                location: '',
                visibility: { email: false, phone: false, website: false, location: true }
            },
            socials: {
                github: '',
                twitter: '',
                wechat: '',
                linkedin: '',
                bilibili: '',
                visibility: { github: false, twitter: false, wechat: false, linkedin: false, bilibili: false }
            },
            skills: {
                list: [],
                visibility: true
            },
            radar: {
                list: [],
                visibility: true
            },
            experience: {
                list: [],
                visibility: true
            },
            theme: {
                preset: 'classic',
                primary: '#ff2a6d',
                secondary: '#05d9e8',
                bg: '#050510'
            }
        };
    }

    // 示例数据
    function exampleResume() {
        const r = emptyResume();
        r.status = 'draft';
        r.username = 'zero';
        r.basic.name = '林默 / ZERO';
        r.basic.title = '赛博空间架构师';
        r.basic.bio = '「夜之城」原住民，12 年分布式系统与全栈开发经验。专注于 AI × Web3 × 沉浸式交互的边界探索。\n\n代码是我的武器，霓虹是我的信仰。';
        r.basic.avatarSeed = 42;
        r.contact.email = 'zero@nightcity.net';
        r.contact.phone = '+86 *** **** 9901';
        r.contact.website = 'https://zero.cyber';
        r.contact.location = 'Night City · 沃森区';
        r.contact.visibility = { email: false, phone: false, website: true, location: true };
        r.socials.github = 'https://github.com/zero';
        r.socials.twitter = '@zero_cyber';
        r.socials.wechat = 'zero_2077';
        r.socials.bilibili = 'https://space.bilibili.com/zero';
        r.socials.visibility = { github: true, twitter: true, wechat: false, linkedin: false, bilibili: true };
        r.skills.list = [
            { name: 'Three.js', level: 95 },
            { name: 'WebGL', level: 88 },
            { name: 'React', level: 92 },
            { name: 'Node.js', level: 90 },
            { name: 'Rust', level: 75 },
            { name: 'Python', level: 85 },
            { name: 'AI/ML', level: 80 },
            { name: 'Solidity', level: 70 }
        ];
        r.skills.visibility = true;
        r.radar.list = [
            { name: '前端', value: 95 },
            { name: '后端', value: 88 },
            { name: '设计', value: 78 },
            { name: '架构', value: 92 },
            { name: 'AI', value: 80 },
            { name: '安全', value: 75 }
        ];
        r.radar.visibility = true;
        r.experience.list = [
            {
                title: '高级前端架构师',
                company: 'Arasaka Industries',
                date: '2081.03 - 至今',
                desc: '主导公司数字孪生平台的前端架构，组建 20 人团队完成多个百万级 DAU 产品。',
                visible: true
            },
            {
                title: '全栈工程师',
                company: 'Netrunner Lab',
                date: '2078.06 - 2081.02',
                desc: '负责沉浸式 Web 应用的开发，主导 Three.js 3D 引擎的封装与团队培训。',
                visible: true
            },
            {
                title: '初级开发者',
                company: '独立工作室',
                date: '2075.09 - 2078.05',
                desc: '从零开始学习，参与多个开源项目，提交 PR 超过 200+。',
                visible: true
            }
        ];
        r.experience.visibility = true;
        r.theme = {
            preset: 'classic',
            primary: '#ff2a6d',
            secondary: '#05d9e8',
            bg: '#050510'
        };
        return r;
    }

    function loadAll() {
        try {
            const raw = localStorage.getItem(KEYS.RESUMES);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveAll(list) {
        try {
            localStorage.setItem(KEYS.RESUMES, JSON.stringify(list));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }

    function getResume(id) {
        return loadAll().find(r => r.id === id);
    }

    function upsert(resume) {
        resume.updatedAt = Date.now();
        const list = loadAll();
        const idx = list.findIndex(r => r.id === resume.id);
        if (idx >= 0) {
            list[idx] = resume;
        } else {
            list.push(resume);
        }
        saveAll(list);
        return resume;
    }

    function remove(id) {
        const list = loadAll().filter(r => r.id !== id);
        saveAll(list);
        if (getCurrentId() === id) {
            setCurrentId(null);
        }
    }

    // 归档：标记为已归档，但不动 updatedAt（保留原始时间用于排序）
    function archive(id, when) {
        const list = loadAll();
        const r = list.find(x => x.id === id);
        if (!r) return null;
        r._archivedAt = when || Date.now();
        saveAll(list);
        return r;
    }

    // 恢复：清除 _archivedAt 标记
    function unarchive(id) {
        const list = loadAll();
        const r = list.find(x => x.id === id);
        if (!r) return null;
        delete r._archivedAt;
        saveAll(list);
        return r;
    }

    // 工具：是否归档
    function isArchived(r) {
        return r && typeof r._archivedAt === 'number';
    }

    function getCurrentId() {
        return localStorage.getItem(KEYS.CURRENT);
    }
    function setCurrentId(id) {
        if (id) localStorage.setItem(KEYS.CURRENT, id);
        else localStorage.removeItem(KEYS.CURRENT);
    }

    function getCurrent() {
        const id = getCurrentId();
        return id ? getResume(id) : null;
    }

    function setCurrent(resume) {
        upsert(resume);
        setCurrentId(resume.id);
    }

    // 统计
    function getStats() {
        const list = loadAll();
        return {
            total: list.length,
            draft: list.filter(r => r.status === 'draft').length,
            local: list.filter(r => r.status === 'local').length,
            public: list.filter(r => r.status === 'public').length
        };
    }

    // 初始化：首次进入注入示例
    function ensureSeed() {
        if (loadAll().length === 0) {
            const ex = exampleResume();
            saveAll([ex]);
        }
    }

    // 设置
    function getSettings() {
        try {
            return JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{}');
        } catch (e) { return {}; }
    }
    function setSetting(k, v) {
        const s = getSettings();
        s[k] = v;
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(s));
    }
    function getSetting(k, def) {
        const s = getSettings();
        return s[k] !== undefined ? s[k] : def;
    }

    // 导出/导入 JSON
    function exportJson(resume) {
        const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cyber-resume-${resume.username || resume.id}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function importJson(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    // 重置 id 防止冲突
                    data.id = EncodeUtil.genId(8);
                    data.updatedAt = Date.now();
                    data.status = 'draft';
                    resolve(data);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // 清除所有
    function clearAll() {
        Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    }

    global.StorageUtil = {
        emptyResume,
        exampleResume,
        loadAll,
        getResume,
        upsert,
        remove,
        archive,
        unarchive,
        isArchived,
        getCurrent,
        setCurrent,
        getCurrentId,
        setCurrentId,
        getStats,
        ensureSeed,
        getSettings,
        setSetting,
        getSetting,
        exportJson,
        importJson,
        clearAll
    };
})(window);
