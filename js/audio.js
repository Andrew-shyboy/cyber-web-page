/* ===== 音效管理 ===== */
(function (global) {
    'use strict';

    // 简单的 WebAudio 合成音效（无需外部音频文件）
    let ctx = null;
    let ambientOsc = null;
    let ambientGain = null;
    let enabled = true;
    let ambientPlaying = false;

    function getCtx() {
        if (!ctx) {
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return null;
            }
        }
        return ctx;
    }

    function resumeCtx() {
        const c = getCtx();
        if (c && c.state === 'suspended') c.resume();
    }

    // 单次音效
    function beep(freq, duration, type = 'sine', vol = 0.05) {
        if (!enabled) return;
        const c = getCtx();
        if (!c) return;
        resumeCtx();
        try {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, c.currentTime);
            gain.gain.linearRampToValueAtTime(vol, c.currentTime + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
            osc.connect(gain).connect(c.destination);
            osc.start();
            osc.stop(c.currentTime + duration);
        } catch (e) {}
    }

    // 音效预设
    const SFX = {
        hover() { beep(1200, 0.04, 'square', 0.02); },
        click() {
            beep(800, 0.05, 'square', 0.04);
            setTimeout(() => beep(1400, 0.04, 'square', 0.03), 30);
        },
        type() { beep(600 + Math.random() * 400, 0.02, 'square', 0.015); },
        success() {
            beep(880, 0.08, 'sine', 0.05);
            setTimeout(() => beep(1320, 0.08, 'sine', 0.05), 80);
            setTimeout(() => beep(1760, 0.12, 'sine', 0.04), 160);
        },
        error() {
            beep(200, 0.15, 'sawtooth', 0.05);
            setTimeout(() => beep(150, 0.2, 'sawtooth', 0.05), 100);
        },
        glitch() {
            for (let i = 0; i < 6; i++) {
                setTimeout(() => beep(200 + Math.random() * 1000, 0.03, 'square', 0.04), i * 30);
            }
        },
        open() {
            beep(400, 0.06, 'sine', 0.04);
            setTimeout(() => beep(800, 0.06, 'sine', 0.04), 60);
        },
        close() {
            beep(800, 0.05, 'sine', 0.04);
            setTimeout(() => beep(400, 0.05, 'sine', 0.04), 50);
        },
        warn() {
            beep(440, 0.1, 'triangle', 0.05);
            setTimeout(() => beep(440, 0.1, 'triangle', 0.05), 150);
        }
    };

    // 背景音（低频氛围）
    function startAmbient() {
        if (ambientPlaying || !enabled) return;
        const c = getCtx();
        if (!c) return;
        resumeCtx();
        try {
            // 多层低频 + 高频噪声调制
            ambientOsc = c.createOscillator();
            const filter = c.createBiquadFilter();
            const lfo = c.createOscillator();
            const lfoGain = c.createGain();
            ambientGain = c.createGain();

            ambientOsc.type = 'sine';
            ambientOsc.frequency.value = 55; // 低 A1

            filter.type = 'lowpass';
            filter.frequency.value = 200;
            filter.Q.value = 8;

            lfo.type = 'sine';
            lfo.frequency.value = 0.15;
            lfoGain.gain.value = 60;
            lfo.connect(lfoGain).connect(filter.frequency);

            ambientGain.gain.setValueAtTime(0, c.currentTime);
            ambientGain.gain.linearRampToValueAtTime(0.025, c.currentTime + 2);

            ambientOsc.connect(filter).connect(ambientGain).connect(c.destination);
            lfo.start();
            ambientOsc.start();
            ambientPlaying = true;
        } catch (e) {
            console.warn('Ambient failed:', e);
        }
    }

    function stopAmbient() {
        if (!ambientPlaying) return;
        try {
            const c = getCtx();
            if (c && ambientGain) {
                ambientGain.gain.cancelScheduledValues(c.currentTime);
                ambientGain.gain.linearRampToValueAtTime(0, c.currentTime + 0.5);
                setTimeout(() => {
                    if (ambientOsc) try { ambientOsc.stop(); } catch (e) {}
                    if (ambientOsc) try { ambientOsc.disconnect(); } catch (e) {}
                    ambientOsc = null;
                }, 600);
            }
        } catch (e) {}
        ambientPlaying = false;
    }

    function setEnabled(v) {
        enabled = !!v;
        StorageUtil.setSetting('audioEnabled', enabled);
        const btn = document.getElementById('audio-toggle');
        if (btn) btn.classList.toggle('muted', !enabled);
        if (enabled) {
            startAmbient();
        } else {
            stopAmbient();
        }
    }

    function isEnabled() { return enabled; }

    function init() {
        enabled = StorageUtil.getSetting('audioEnabled', true);
        const btn = document.getElementById('audio-toggle');
        if (btn) {
            btn.classList.toggle('muted', !enabled);
            btn.addEventListener('click', () => setEnabled(!enabled));
        }
        // 用户首次交互时启动 ambient
        const tryStart = () => {
            if (enabled) startAmbient();
            document.removeEventListener('click', tryStart);
            document.removeEventListener('keydown', tryStart);
            document.removeEventListener('touchstart', tryStart);
        };
        document.addEventListener('click', tryStart, { once: true });
        document.addEventListener('keydown', tryStart, { once: true });
        document.addEventListener('touchstart', tryStart, { once: true });
    }

    global.AudioUtil = {
        SFX,
        init,
        setEnabled,
        isEnabled,
        startAmbient,
        stopAmbient
    };
})(window);
