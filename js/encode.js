/* ===== 编码工具：URL 数据编解码 ===== */
(function (global) {
    'use strict';

    // Unicode-safe base64
    function utf8ToBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }
    function base64ToUtf8(b64) {
        try {
            return decodeURIComponent(escape(atob(b64)));
        } catch (e) {
            return null;
        }
    }

    // 简单的字符串压缩（去除冗余空白）
    function compact(obj) {
        return JSON.stringify(obj);
    }

    function encode(data) {
        try {
            const json = compact(data);
            return utf8ToBase64(json)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        } catch (e) {
            console.error('Encode failed:', e);
            return null;
        }
    }

    function decode(str) {
        if (!str) return null;
        try {
            // 还原标准 base64
            let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4) b64 += '=';
            const json = base64ToUtf8(b64);
            if (!json) return null;
            return JSON.parse(json);
        } catch (e) {
            console.error('Decode failed:', e);
            return null;
        }
    }

    // 生成短 ID
    function genId(len = 8) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < len; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }

    // 校验 username
    function validUsername(name) {
        return /^[a-z0-9_-]{3,20}$/i.test(name);
    }

    // URL hash 中的简历数据
    function getHashData() {
        const hash = location.hash;
        const m = hash.match(/[#&]data=([^&]+)/);
        if (!m) return null;
        return decode(m[1]);
    }

    function buildResumeUrl(username, data) {
        const encoded = encode(data);
        if (!encoded) return null;
        const base = location.origin + location.pathname;
        return `${base}#/u/${encodeURIComponent(username)}&data=${encoded}`;
    }

    function buildShortUrl(username) {
        const base = location.origin + location.pathname;
        return `${base}#/u/${encodeURIComponent(username)}`;
    }

    global.EncodeUtil = {
        encode,
        decode,
        genId,
        validUsername,
        getHashData,
        buildResumeUrl,
        buildShortUrl
    };
})(window);
