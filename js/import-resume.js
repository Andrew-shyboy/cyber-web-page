/* ===== 简历导入与识别（v2：全站拖拽 → 动画 → 跳转 → 填充） =====
 * 流程：
 *   1. 用户在任何页面拖入简历文件（JSON / TXT / MD / PDF / DOCX）
 *   2. 解析成功 → 数码粒子消散动画 ~2.7s
 *   3. 动画结束：
 *      - 把当前正在编辑的草稿自动保存到 dashboard
 *      - 创建新草稿并合并识别结果
 *      - 跳转到 #/editor，自动填充表单 + 高亮 AI 填充字段
 *   4. 解析失败 → 红色故障动画 ~1.5s，停留在原页面
 */
(function (global) {
    'use strict';

    /* ===================================================================
     * 1. 启发式解析
     * =================================================================== */

    const RX = {
        email: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
        phone: /(?:\+?\d{1,3}[\s\-.]?)?(?:\(?\d{2,4}\)?[\s\-.]?)?\d{3,4}[\s\-.]?\d{4}/g,
        url: /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+/g,
        github: /github\.com\/([A-Za-z0-9_\-]+)/i,
        twitter: /(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)/i,
        bilibili: /space\.bilibili\.com\/(\d+)/i,
        linkedin: /linkedin\.com\/in\/([A-Za-z0-9\-]+)/i,
        weibo: /weibo\.com\/([A-Za-z0-9_]+)/i,
        dateRange: /((?:19|20)\d{2})\s*[\.\-/年]\s*(\d{0,2})\s*[-—–~到至]\s*((?:19|20)\d{2}\s*[\.\-/年]?\s*\d{0,2}|今|至今|现在|Present|Now)/g,
        year: /\b(19|20)\d{2}\b/g
    };

    const SKILL_DICT = [
        'JavaScript', 'TypeScript', 'Node.js', 'React', 'Vue', 'Angular', 'Svelte',
        'Next.js', 'Nuxt', 'Express', 'Koa', 'NestJS', 'Redux', 'MobX', 'Webpack',
        'Vite', 'Rollup', 'Babel', 'ESLint', 'Jest', 'Mocha', 'Cypress', 'Puppeteer',
        'Python', 'Django', 'Flask', 'FastAPI', 'NumPy', 'Pandas', 'PyTorch', 'TensorFlow',
        'Java', 'Kotlin', 'Spring', 'Spring Boot', 'Hibernate', 'Maven', 'Gradle',
        'Go', 'Golang', 'Rust', 'C++', 'C#', 'C', 'PHP', 'Laravel', 'Symfony',
        'Ruby', 'Rails', 'Swift', 'Objective-C', 'iOS', 'Android', 'Flutter', 'Dart',
        'HTML', 'CSS', 'Sass', 'Less', 'Tailwind', 'Bootstrap', 'Material UI',
        'Three.js', 'WebGL', 'OpenGL', 'Canvas', 'D3.js', 'GSAP',
        'GraphQL', 'REST', 'gRPC', 'WebSocket', 'Socket.IO',
        'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra',
        'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'GitLab CI',
        'AWS', 'GCP', 'Azure', 'Aliyun', 'Cloudflare',
        'Linux', 'Nginx', 'Apache', 'Shell', 'Bash', 'PowerShell',
        'Git', 'SVN', 'Mercurial',
        'Solidity', 'Web3', 'Ethereum', 'Bitcoin', 'NFT', 'Smart Contract',
        'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'AI',
        'Figma', 'Sketch', 'Photoshop', 'Illustrator', 'Premiere', 'After Effects',
        'Unity', 'Unreal Engine', 'Blender', 'Maya',
        'Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'TDD'
    ];

    const TITLE_HINTS = [
        'engineer', 'developer', 'architect', 'designer', 'manager', 'lead', 'director',
        'founder', 'cto', 'ceo', 'coo', 'pm', 'product', 'data', 'scientist',
        'analyst', 'consultant', 'researcher', 'professor', 'teacher', 'mentor',
        '工程师', '架构师', '设计师', '经理', '主管', '总监', '创始人', '产品',
        '研发', '前端', '后端', '全栈', '运维', '测试', '数据', '算法', '科学家',
        '分析师', '顾问', '研究员', '教师', '导师', '实习生'
    ];

    function parseText(text) {
        if (!text) return { data: emptyExtracted(), filled: [] };
        const out = emptyExtracted();
        const filled = new Set(); // 记录被填充的字段路径
        const raw = text;

        const emails = raw.match(RX.email) || [];
        if (emails.length) { out.contact.email = emails[0]; filled.add('contact.email'); }

        const phoneCandidates = (raw.match(RX.phone) || [])
            .map(s => s.trim())
            .filter(s => s.replace(/\D/g, '').length >= 7);
        if (phoneCandidates.length) { out.contact.phone = phoneCandidates[0]; filled.add('contact.phone'); }

        const urls = raw.match(RX.url) || [];
        if (urls.length) {
            out.contact.website = urls.find(u => !/github|twitter|x\.com|space\.bilibili|linkedin|weibo/i.test(u)) || urls[0];
            filled.add('contact.website');
        }

        const gh = raw.match(RX.github);
        if (gh) { out.socials.github = 'https://github.com/' + gh[1]; filled.add('socials.github'); }
        const tw = raw.match(RX.twitter);
        if (tw) { out.socials.twitter = 'https://x.com/' + tw[1]; filled.add('socials.twitter'); }
        const bi = raw.match(RX.bilibili);
        if (bi) { out.socials.bilibili = 'https://space.bilibili.com/' + bi[1]; filled.add('socials.bilibili'); }
        const li = raw.match(RX.linkedin);
        if (li) { out.socials.linkedin = 'https://linkedin.com/in/' + li[1]; filled.add('socials.linkedin'); }
        const wb = raw.match(RX.weibo);
        if (wb) { out.socials.wechat = wb[1]; filled.add('socials.wechat'); }

        const wechatMatch = raw.match(/(?:微信|wechat|wx|weixin)\s*[:\uff1a]\s*([A-Za-z0-9_\-]+)/i);
        if (wechatMatch) { out.socials.wechat = wechatMatch[1]; filled.add('socials.wechat'); }

        const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

        if (lines.length) {
            const first = lines[0];
            if (
                first.length <= 30 &&
                !/[@\d]/.test(first) &&
                !/^https?:\/\//.test(first) &&
                first.split(/\s+/).length <= 5
            ) {
                out.basic.name = first; filled.add('basic.name');
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const m = line.match(/^([^:：]{1,15})\s*[:：]\s*(.+)$/);
            if (!m) continue;
            const key = m[1].toLowerCase().trim();
            const val = m[2].trim();
            if (!val) continue;

            if (/(姓名|名字|name)/i.test(key)) { out.basic.name = val; filled.add('basic.name'); }
            else if (/(职位|岗位|职业|title|position|role)/i.test(key)) { out.basic.title = val; filled.add('basic.title'); }
            else if (/(邮箱|email|e-mail)/i.test(key) && !out.contact.email) { out.contact.email = val; filled.add('contact.email'); }
            else if (/(电话|手机|phone|tel)/i.test(key) && !out.contact.phone) { out.contact.phone = val; filled.add('contact.phone'); }
            else if (/(网站|website|blog|个人站)/i.test(key) && !out.contact.website) { out.contact.website = val; filled.add('contact.website'); }
            else if (/(所在地|城市|location|address)/i.test(key)) { out.contact.location = val; filled.add('contact.location'); }
            else if (/(简介|个人简介|about|summary|objective)/i.test(key)) { out.basic.bio = val; filled.add('basic.bio'); }
            else if (/(技能|skills?|tech)/i.test(key)) {
                out.skills.list = splitSkills(val);
                filled.add('skills.list');
            }
        }

        if (!out.basic.name && lines.length >= 2) {
            const l2 = lines[1];
            if (l2.length <= 40 && TITLE_HINTS.some(t => l2.toLowerCase().includes(t.toLowerCase()))) {
                out.basic.title = l2; filled.add('basic.title');
            }
        }

        if (!out.basic.bio) {
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].length >= 50) {
                    out.basic.bio = lines[i]; filled.add('basic.bio');
                    break;
                }
            }
        }

        const skillSet = new Map();
        SKILL_DICT.forEach(skill => {
            const re = new RegExp('(^|[^A-Za-z0-9+#])' + escapeReg(skill) + '($|[^A-Za-z0-9+#])', 'i');
            if (re.test(raw)) {
                const occ = (raw.match(new RegExp(escapeReg(skill), 'gi')) || []).length;
                const level = Math.min(95, 65 + occ * 8);
                skillSet.set(skill, level);
            }
        });
        if (skillSet.size) {
            out.skills.list = Array.from(skillSet.entries())
                .map(([name, level]) => ({ name, level }))
                .sort((a, b) => b.level - a.level)
                .slice(0, 12);
            filled.add('skills.list');
        }

        const dateMatches = [];
        let dm;
        const dateRe = new RegExp(RX.dateRange.source, 'g');
        while ((dm = dateRe.exec(raw)) !== null) {
            // 修复 endMonth 解析（之前会取到年份）
            const startYear = dm[1];
            const startMonth = dm[2] ? dm[2].padStart(2, '0') : '01';
            const endRaw = dm[3];
            const endYearMatch = endRaw.match(/((?:19|20)\d{2})/);
            const endYear = endYearMatch ? endYearMatch[1] : '至今';
            // 提取月份：把年份剔除后再匹配
            const endRawNoYear = endRaw.replace(/((?:19|20)\d{2})/, '');
            const endMonthMatch = endRawNoYear.match(/\d{1,2}/);
            const endMonth = endMonthMatch ? endMonthMatch[0].padStart(2, '0') : '01';
            const dateStr = `${startYear}.${startMonth} - ${endYear === '至今' ? '至今' : endYear + '.' + endMonth}`;
            const idx = dm.index;
            // 从日期所在行中提取角色（如果在同行）
            const lineStart = raw.lastIndexOf('\n', Math.max(0, idx - 1)) + 1;
            const lineEnd = raw.indexOf('\n', idx);
            const sameLine = raw.slice(lineStart, lineEnd === -1 ? raw.length : lineEnd);
            // 同行剩余：日期之后的部分
            const afterDateSameLine = sameLine.slice(idx - lineStart + dm[0].length).trim();
            // 上一行
            const prevLineStart = raw.lastIndexOf('\n', lineStart - 2) + 1;
            const prevLine = raw.slice(prevLineStart, lineStart - 1).trim();

            let title = '';
            let company = '';
            // 优先从同行提取（格式：日期 角色 @ 公司）
            const sameLineMatch = afterDateSameLine.match(/^(.+?)\s*[@\/／]\s*(.+?)(?:[，,。]|$)/);
            if (sameLineMatch) {
                title = sameLineMatch[1].trim();
                company = sameLineMatch[2].trim();
            } else if (afterDateSameLine) {
                title = afterDateSameLine.split(/[，,。]/)[0].trim();
            } else {
                // 同行没有，尝试上一行
                const prevMatch = prevLine.match(/^(.+?)\s*[@\/／]\s*(.+?)(?:[，,。]|$)/);
                if (prevMatch) {
                    title = prevMatch[1].trim();
                    company = prevMatch[2].trim();
                } else {
                    title = prevLine;
                }
            }
            dateMatches.push({ date: dateStr, title, company, desc: afterDateSameLine });
        }
        if (dateMatches.length) {
            out.experience.list = dateMatches.slice(0, 6);
            filled.add('experience.list');
        }

        return { data: out, filled: Array.from(filled) };
    }

    function splitSkills(s) {
        return s.split(/[,,;;\/\u3001\u3000|]+|\s+and\s+/i)
            .map(x => x.trim())
            .filter(x => x && x.length < 30)
            .map(name => ({ name, level: 75 }));
    }

    function escapeReg(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function emptyExtracted() {
        return {
            basic: { name: '', title: '', bio: '' },
            contact: { email: '', phone: '', website: '', location: '' },
            socials: { github: '', twitter: '', wechat: '', linkedin: '', bilibili: '' },
            skills: { list: [] },
            experience: { list: [] }
        };
    }

    function parseJSON(text) {
        let data;
        try { data = JSON.parse(text); } catch (e) { return null; }

        if (data.basic && data.contact && data.skills) {
            // 站点导出格式 - 所有字段都标记
            return {
                data: {
                    basic: {
                        name: data.basic.name || '',
                        title: data.basic.title || '',
                        bio: data.basic.bio || ''
                    },
                    contact: data.contact,
                    socials: data.socials || {},
                    skills: data.skills,
                    experience: data.experience || { list: [] }
                },
                filled: ['basic.name', 'basic.title', 'basic.bio', 'contact.email', 'contact.phone', 'contact.website', 'contact.location', 'socials.github', 'socials.twitter', 'socials.wechat', 'socials.linkedin', 'socials.bilibili', 'skills.list', 'experience.list']
            };
        }

        if (data.basics) {
            const b = data.basics;
            const filled = [];
            const result = {
                basic: { name: '', title: '', bio: '' },
                contact: { email: '', phone: '', website: '', location: '' },
                socials: { github: '', twitter: '', wechat: '', linkedin: '', bilibili: '' },
                skills: { list: [] },
                experience: { list: [] }
            };
            if (b.name) { result.basic.name = b.name; filled.push('basic.name'); }
            if (b.label) { result.basic.title = b.label; filled.push('basic.title'); }
            if (b.summary) { result.basic.bio = b.summary; filled.push('basic.bio'); }
            if (b.email) { result.contact.email = b.email; filled.push('contact.email'); }
            if (b.phone) { result.contact.phone = b.phone; filled.push('contact.phone'); }
            if (b.url) { result.contact.website = b.url; filled.push('contact.website'); }
            if (b.location && (b.location.city || b.location.address)) {
                result.contact.location = b.location.city || b.location.address;
                filled.push('contact.location');
            }
            const profiles = b.profiles || [];
            const gh = profiles.find(p => /github/i.test(p.network));
            if (gh) { result.socials.github = gh.url; filled.push('socials.github'); }
            const tw = profiles.find(p => /twitter/i.test(p.network));
            if (tw) { result.socials.twitter = tw.url; filled.push('socials.twitter'); }
            const li = profiles.find(p => /linkedin/i.test(p.network));
            if (li) { result.socials.linkedin = li.url; filled.push('socials.linkedin'); }
            const bi = profiles.find(p => /bilibili/i.test(p.network));
            if (bi) { result.socials.bilibili = bi.url; filled.push('socials.bilibili'); }
            if ((data.skills || []).length) {
                result.skills.list = data.skills.map(s => ({ name: s.name, level: s.level || 75 }));
                filled.push('skills.list');
            }
            if ((data.work || []).length) {
                result.experience.list = data.work.map(w => ({
                    title: w.position || '',
                    company: w.name || '',
                    date: [w.startDate, w.endDate].filter(Boolean).join(' - '),
                    desc: w.summary || (w.highlights || []).join(' / ')
                }));
                filled.push('experience.list');
            }
            return { data: result, filled };
        }

        return null;
    }

    /* ===================================================================
     * 2. 文件分发
     * =================================================================== */

    function readFileText(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = () => reject(r.error);
            r.readAsText(file);
        });
    }

    function readFileArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = () => reject(r.error);
            r.readAsArrayBuffer(file);
        });
    }

    async function parseFile(file) {
        const name = (file.name || '').toLowerCase();
        if (name.endsWith('.json')) {
            const text = await readFileText(file);
            const jsonResult = parseJSON(text);
            if (jsonResult) return { type: 'json', ...jsonResult };
            return { type: 'text', ...parseText(text), raw: text };
        }
        if (name.endsWith('.docx')) {
            if (global.mammoth && global.mammoth.extractRawText) {
                const buf = await readFileArrayBuffer(file);
                const result = await mammoth.extractRawText({ arrayBuffer: buf });
                return { type: 'docx', ...parseText(result.value), raw: result.value };
            }
            throw new Error('DOCX 解析库未加载，请联网后重试');
        }
        if (name.endsWith('.pdf')) {
            if (global.pdfjsLib) {
                const buf = await readFileArrayBuffer(file);
                const pdf = await global.pdfjsLib.getDocument({ data: buf }).promise;
                let allText = '';
                for (let p = 1; p <= pdf.numPages; p++) {
                    const page = await pdf.getPage(p);
                    const tc = await page.getTextContent();
                    allText += tc.items.map(i => i.str).join(' ') + '\n';
                }
                if (!allText.trim()) throw new Error('PDF 中无可识别文本（可能是扫描件或纯图片）');
                return { type: 'pdf', ...parseText(allText), raw: allText };
            }
            throw new Error('PDF 解析库未加载，请联网后重试');
        }
        const text = await readFileText(file);
        return { type: 'text', ...parseText(text), raw: text };
    }

    /* ===================================================================
     * 3. 合并到 resume 对象 + 记录填充字段
     * =================================================================== */

    function mergeWithTarget(target, extracted) {
        if (!target || !extracted) return { target, fields: [] };
        const fields = [];

        ['name', 'title', 'bio'].forEach(k => {
            if (extracted.basic[k]) {
                if (!target.basic[k]) { target.basic[k] = extracted.basic[k]; fields.push('basic.' + k); }
            }
        });

        ['email', 'phone', 'website', 'location'].forEach(k => {
            if (extracted.contact[k] && !target.contact[k]) {
                target.contact[k] = extracted.contact[k];
                fields.push('contact.' + k);
            }
        });

        ['github', 'twitter', 'wechat', 'linkedin', 'bilibili'].forEach(k => {
            if (extracted.socials[k] && !target.socials[k]) {
                target.socials[k] = extracted.socials[k];
                fields.push('socials.' + k);
            }
        });

        if (extracted.skills.list && extracted.skills.list.length) {
            const have = new Set(target.skills.list.map(s => s.name.toLowerCase()));
            let added = 0;
            extracted.skills.list.forEach(s => {
                if (!have.has(s.name.toLowerCase())) {
                    target.skills.list.push(s);
                    have.add(s.name.toLowerCase());
                    added++;
                }
            });
            if (added) fields.push('skills.list');
        }

        if (extracted.experience.list && extracted.experience.list.length) {
            target.experience.list = target.experience.list.concat(extracted.experience.list);
            fields.push('experience.list');
        }

        return { target, fields };
    }

    /* ===================================================================
     * 4. 数码粒子消散动画
     * =================================================================== */

    function startDigitizeAnimation(rawText, options, onComplete) {
        if (typeof options === 'function') { onComplete = options; options = {}; }
        options = options || {};
        const cyan = options.color || '#05d9e8';
        const green = options.green || '#4ade80';
        const pink = options.pink || '#ff2a6d';
        const allowCancel = options.allowCancel !== false;

        const MAX = 1800;
        const text = (rawText || '').slice(0, MAX);
        if (text.length < 4) {
            if (onComplete) onComplete();
            return { cancel: () => {} };
        }

        const stage = document.createElement('div');
        stage.className = 'digitize-stage';
        stage.innerHTML = `
            <canvas class="digitize-canvas"></canvas>
            <div class="digitize-corners">
                <div class="c tl"></div>
                <div class="c tr"></div>
                <div class="c bl"></div>
                <div class="c br"></div>
            </div>
            <div class="digitize-ui">
                <div class="digitize-title">// DECODING RESUME //</div>
                <div class="digitize-status" id="digi-status">EXTRACTING DATA <span class="ok">▸</span></div>
                <div class="digitize-progress" id="digi-progress"></div>
            </div>
            <div class="digitize-meta">
                <div class="left">
                    <span>FILE: <strong>${escapeHtml((options.fileName || 'unknown').slice(0, 32))}</strong></span>
                    <span>FORMAT: <strong>${escapeHtml((options.format || 'TEXT').toUpperCase())}</strong></span>
                </div>
                <div class="right">
                    <span>CHARS: <strong id="digi-char-count">0</strong></span>
                    <span>STATUS: <strong id="digi-status-tag" style="color:${green}">RUNNING</strong></span>
                </div>
            </div>
        `;
        document.body.appendChild(stage);

        const canvas = stage.querySelector('.digitize-canvas');
        const ctx = canvas.getContext('2d');
        const progressEl = stage.querySelector('#digi-progress');
        const charCountEl = stage.querySelector('#digi-char-count');
        const statusTagEl = stage.querySelector('#digi-status-tag');

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let W, H;
        function resize() {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();

        const charSize = W >= 1200 ? 16 : W >= 800 ? 14 : 12;
        const lineHeight = charSize * 1.5;
        const charWidth = charSize * 0.62;

        const chars = [];
        const textLines = text.split(/\r?\n/);
        const cols = Math.floor((W * 0.85) / charWidth);
        let line = 0;
        let col = 0;
        textLines.forEach(rawLine => {
            const segs = rawLine.length > cols ? chunkString(rawLine, cols) : [rawLine];
            segs.forEach(seg => {
                for (let i = 0; i < seg.length; i++) {
                    const ch = seg[i];
                    if (ch === ' ') { col++; continue; }
                    chars.push({
                        ch,
                        x: (W - cols * charWidth) / 2 + col * charWidth + charWidth / 2,
                        y: (H - textLines.length * lineHeight) / 2 + line * lineHeight,
                        seed: Math.random() * 1000,
                        delay: Math.random() * 350
                    });
                    col++;
                }
                line++;
                col = 0;
            });
        });

        charCountEl.textContent = chars.length;

        const startTime = performance.now();
        const P1 = 700;
        const P2 = 800;
        const P3 = 1200;
        const TOTAL = P1 + P2 + P3;

        function draw() {
            const now = performance.now();
            const t = now - startTime;
            const progress = Math.min(100, (t / TOTAL) * 100);
            progressEl.style.setProperty('--p', progress + '%');

            ctx.fillStyle = 'rgba(2, 2, 10, 0.32)';
            ctx.fillRect(0, 0, W, H);

            ctx.strokeStyle = 'rgba(5, 217, 232, 0.05)';
            ctx.lineWidth = 1;
            const gridSize = 60;
            for (let gx = 0; gx < W; gx += gridSize) {
                ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
            }
            for (let gy = 0; gy < H; gy += gridSize) {
                ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
            }

            let alive = 0;
            for (let i = 0; i < chars.length; i++) {
                const c = chars[i];
                const localT = t - c.delay;
                if (localT < 0) {
                    ctx.fillStyle = cyan;
                    ctx.font = `${charSize}px 'Share Tech Mono', monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(c.ch, c.x, c.y);
                    alive++; continue;
                }
                if (localT < P1) {
                    ctx.fillStyle = cyan;
                    ctx.font = `${charSize}px 'Share Tech Mono', monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.globalAlpha = 1;
                    ctx.fillText(c.ch, c.x, c.y);
                    alive++;
                } else if (localT < P1 + P2) {
                    const p = (localT - P1) / P2;
                    const bin = Math.random() < 0.5 ? '0' : '1';
                    ctx.fillStyle = p < 0.5 ? cyan : green;
                    ctx.font = `${charSize}px 'Share Tech Mono', monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.globalAlpha = 1;
                    ctx.fillText(bin, c.x, c.y);
                    if (Math.random() < 0.05) {
                        ctx.fillStyle = pink;
                        ctx.fillText(c.ch, c.x, c.y - 1);
                    }
                    alive++;
                } else if (localT < TOTAL) {
                    const p = (localT - P1 - P2) / P3;
                    const drift = Math.sin(c.seed) * 30 * p;
                    const yOff = -p * 80 - p * p * 40;
                    const alpha = Math.max(0, 1 - p);
                    const sz = charSize * (1 - p * 0.5);
                    const bin = Math.random() < 0.5 ? '0' : '1';
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = i % 5 === 0 ? pink : green;
                    ctx.font = `${sz}px 'Share Tech Mono', monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(bin, c.x + drift, c.y + yOff);
                    if (alpha > 0.1) alive++;
                }
            }
            ctx.globalAlpha = 1;

            if (t < TOTAL && alive > 0) {
                requestAnimationFrame(draw);
            } else {
                statusTagEl.textContent = 'COMPLETE';
                statusTagEl.style.color = green;
                if (global.AudioUtil) AudioUtil.SFX.success();
                if (global.Toast) Toast.show('✅ 简历数据已解码', 'success');

                setTimeout(() => {
                    stage.style.transition = 'opacity 0.35s ease';
                    stage.style.opacity = '0';
                    setTimeout(() => {
                        if (stage.parentNode) stage.parentNode.removeChild(stage);
                        if (onComplete) onComplete();
                    }, 380);
                }, 280);
            }
        }

        requestAnimationFrame(draw);

        const onResize = () => resize();
        window.addEventListener('resize', onResize);

        let cancelled = false;
        const onKey = (e) => {
            if (e.key === 'Escape' && allowCancel) {
                cancelled = true;
                if (stage.parentNode) stage.parentNode.removeChild(stage);
                window.removeEventListener('resize', onResize);
                window.removeEventListener('keydown', onKey);
                // 解析 cancelled 标志，让调用方决定是否继续
                if (onComplete) onComplete({ cancelled: true });
            }
        };
        if (allowCancel) window.addEventListener('keydown', onKey);

        return {
            cancel: () => {
                cancelled = true;
                if (stage.parentNode) stage.parentNode.removeChild(stage);
                window.removeEventListener('resize', onResize);
                window.removeEventListener('keydown', onKey);
            },
            isCancelled: () => cancelled
        };
    }

    /* ===================================================================
     * 5. 错误动画（红色故障）
     * =================================================================== */

    function showErrorAnimation(message, onComplete) {
        const stage = document.createElement('div');
        stage.className = 'digitize-stage digitize-stage--error';
        stage.innerHTML = `
            <div class="error-glitch-wrap">
                <div class="error-glyph">✕</div>
                <div class="error-title" data-text="ERROR">ERROR</div>
                <div class="error-sub">// ${escapeHtml(message || 'PARSE FAILED')} //</div>
                <div class="error-hint">保持在原页面。请检查文件格式后重试。</div>
            </div>
        `;
        document.body.appendChild(stage);

        if (global.AudioUtil) AudioUtil.SFX.error();

        // 抖动屏幕
        document.body.classList.add('error-shake');
        setTimeout(() => document.body.classList.remove('error-shake'), 1200);

        setTimeout(() => {
            stage.style.transition = 'opacity 0.3s ease';
            stage.style.opacity = '0';
            setTimeout(() => {
                if (stage.parentNode) stage.parentNode.removeChild(stage);
                if (onComplete) onComplete();
            }, 320);
        }, 1500);
    }

    function chunkString(s, n) {
        const arr = [];
        for (let i = 0; i < s.length; i += n) arr.push(s.slice(i, i + n));
        return arr;
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    /* ===================================================================
     * 6. 拖拽 / 粘贴 入口
     * =================================================================== */

    let dropInitialized = false;
    let overlay = null;
    let flowRunning = false; // 全局锁：防止动画期间重复触发

    function ensureOverlay() {
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.className = 'drag-overlay';
        overlay.innerHTML = `
            <div class="drag-overlay-inner">
                <div class="drag-icon">⬇</div>
                <div class="drag-title">释放文件以<span class="hl">自动识别</span></div>
                <div class="drag-subtitle">// DROP RESUME FILE TO PARSE //</div>
                <div class="drag-formats">
                    <span class="drag-format">JSON</span>
                    <span class="drag-format">TXT</span>
                    <span class="drag-format">MD</span>
                    <span class="drag-format">PDF</span>
                    <span class="drag-format">DOCX</span>
                </div>
                <div class="drag-paste">也可直接 <kbd>Ctrl</kbd> + <kbd>V</kbd> 粘贴简历文本</div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    function showOverlay() {
        ensureOverlay().classList.add('active');
    }
    function hideOverlay() {
        if (overlay) overlay.classList.remove('active');
    }

    function initDropZone() {
        if (dropInitialized) return;
        dropInitialized = true;

        let dragCounter = 0;

        document.addEventListener('dragenter', (e) => {
            if (!hasFiles(e)) return;
            dragCounter++;
            showOverlay();
        });
        document.addEventListener('dragover', (e) => {
            if (!hasFiles(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        document.addEventListener('dragleave', (e) => {
            if (!hasFiles(e)) return;
            dragCounter--;
            if (dragCounter <= 0) { dragCounter = 0; hideOverlay(); }
        });
        document.addEventListener('drop', async (e) => {
            if (!hasFiles(e)) return;
            e.preventDefault();
            dragCounter = 0;
            hideOverlay();
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (!file) return;
            runFullImportFlow(file);
        });
        // 兜底：dragend（鼠标释放但未在文档内）也要隐藏遮罩
        document.addEventListener('dragend', () => {
            dragCounter = 0;
            hideOverlay();
        });
        // window 失焦时也兜底
        window.addEventListener('blur', () => {
            dragCounter = 0;
            hideOverlay();
        });

        // 粘贴
        document.addEventListener('paste', async (e) => {
            const text = (e.clipboardData || window.clipboardData).getData('text');
            if (!text || text.length < 30) return;
            const tag = (e.target && e.target.tagName) || '';
            if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
            e.preventDefault();
            runFullImportText(text, 'PASTE', 'pasted-text');
        });
    }

    function hasFiles(e) {
        if (!e.dataTransfer) return false;
        const types = e.dataTransfer.types;
        if (!types) return false;
        return Array.from(types).includes('Files');
    }

    /* ===================================================================
     * 7. 主流程：全站拖拽 → 动画 → 跳转 → 填充
     * =================================================================== */

    async function runFullImportFlow(file) {
        if (flowRunning) return; // 全局锁
        flowRunning = true;
        try {
            if (global.AudioUtil) AudioUtil.SFX.click();

            // 1) 解析
            let result;
            try {
                result = await parseFile(file);
            } catch (err) {
                console.error('[Import parseFile]', err);
                await new Promise(res => showErrorAnimation(err.message || '解析失败', res));
                if (global.Toast) Toast.show('❌ 解析失败：' + (err.message || ''), 'error');
                return;
            }

            const { data, filled } = result;
            if (!data || !isExtractedUseful(data)) {
                await new Promise(res => showErrorAnimation('未识别到简历内容', res));
                if (global.Toast) Toast.show('❌ 未识别到有效内容，请检查文件格式', 'error');
                return;
            }

            // 2) 数码粒子动画（带取消检测）
            const displayText = (result.raw && result.raw.trim()) || JSON.stringify(data, null, 2);
            const animResult = await new Promise(res => {
                startDigitizeAnimation(displayText, {
                    fileName: file.name || 'unknown',
                    format: result.type || 'TEXT'
                }, res);
            });
            if (animResult && animResult.cancelled) {
                if (global.Toast) Toast.show('已取消导入', 'info');
                return;
            }

            // 3) 收尾：保存当前草稿到 dashboard，创建新草稿，跳转编辑器
            finalizeImport(data, filled, file.name, result.type);
        } catch (err) {
            console.error('[Import flow]', err);
            await new Promise(res => showErrorAnimation(err.message || '流程异常', res));
        } finally {
            flowRunning = false;
        }
    }

    async function runFullImportText(text, format, fileName) {
        if (flowRunning) return;
        flowRunning = true;
        try {
            if (global.AudioUtil) AudioUtil.SFX.click();

            // 解析（先 JSON 再启发式）
            let result = parseJSON(text);
            if (!result) result = parseText(text);

            const { data, filled } = result;
            if (!data || !isExtractedUseful(data)) {
                await new Promise(res => showErrorAnimation('未识别到简历内容', res));
                if (global.Toast) Toast.show('❌ 未识别到有效内容，请检查文件格式', 'error');
                return;
            }

            const animResult = await new Promise(res => {
                startDigitizeAnimation(text, { fileName, format }, res);
            });
            if (animResult && animResult.cancelled) {
                if (global.Toast) Toast.show('已取消导入', 'info');
                return;
            }

            finalizeImport(data, filled, fileName, format);
        } catch (err) {
            console.error('[Import text flow]', err);
            await new Promise(res => showErrorAnimation(err.message || '流程异常', res));
        } finally {
            flowRunning = false;
        }
    }

    function isExtractedUseful(e) {
        if (!e) return false;
        // 任一字段非空即视为有效
        if (e.basic && (e.basic.name || e.basic.title || e.basic.bio)) return true;
        if (e.contact) {
            for (const k of ['email', 'phone', 'website', 'location']) {
                if (e.contact[k]) return true;
            }
        }
        if (e.socials) {
            for (const k of ['github', 'twitter', 'wechat', 'linkedin', 'bilibili']) {
                if (e.socials[k]) return true;
            }
        }
        if (e.skills && e.skills.list && e.skills.list.length) return true;
        if (e.experience && e.experience.list && e.experience.list.length) return true;
        return false;
    }

    function finalizeImport(extracted, filled, fileName, format) {
        if (!global.StorageUtil) {
            console.error('[Import] StorageUtil 未加载');
            return;
        }

        // 0) 如果当前在编辑器，先强制 flush 未保存的修改（避免被动画期间丢失）
        if (global.EditorPage && global.EditorPage.forceSave) {
            try { global.EditorPage.forceSave(); } catch (e) { /* noop */ }
        }

        // 1) 把当前正在编辑的草稿归档（标记 _archivedAt，不动 updatedAt）
        const currentId = StorageUtil.getCurrentId();
        if (currentId) {
            const cur = StorageUtil.getResume(currentId);
            if (cur && !cur._importedFrom && !cur._archivedAt) {
                StorageUtil.archive(currentId);
            }
        }

        // 2) 创建新草稿
        const newResume = StorageUtil.emptyResume();
        newResume.status = 'draft';
        newResume._importedFrom = { fileName, format, at: Date.now() };
        newResume._aiFilled = filled || [];

        // 3) 合并识别结果
        const { target, fields } = mergeWithTarget(newResume, extracted);
        newResume._aiFilled = Array.from(new Set([...(newResume._aiFilled || []), ...fields]));

        // 4) 设置为 current 并保存
        StorageUtil.setCurrent(newResume);

        // 5) 跳转到编辑器
        if (global.App && global.App.navigate) {
            global.App.navigate('#/editor');
        } else {
            location.hash = '#/editor';
        }

        // 6) Toast 提示
        if (global.Toast) {
            const n = (newResume._aiFilled || []).length;
            const hasOld = currentId && StorageUtil.getResume(currentId);
            const tail = hasOld ? '，原草稿已归档到个人中心' : '';
            Toast.show(`✅ 已识别 ${n} 个字段${tail}`, 'success', 4500);
        }
    }

    /* ===================================================================
     * 导出
     * =================================================================== */

    global.ImportUtil = {
        // 解析器
        parseText,
        parseJSON,
        parseFile,
        mergeWithTarget,
        // 动画
        startDigitizeAnimation,
        showErrorAnimation,
        // 入口
        initDropZone,
        runFullImportFlow,
        runFullImportText,
        isBusy: () => flowRunning
    };
})(window);
