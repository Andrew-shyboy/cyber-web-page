/* ===== 个人中心 3D 场景（矩阵雨） ===== */
(function (global) {
    'use strict';

    let scene, camera, renderer, clock;
    let rainDrops = [];
    let mouse = { x: 0, y: 0 };
    let mouseTarget = { x: 0, y: 0 };
    let active = false;
    let isMobile = false;

    function init() {
        if (typeof THREE === 'undefined') return;
        isMobile = matchMedia('(max-width: 768px)').matches;
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x050510, 0.04);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 30);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        clock = new THREE.Clock();

        createLights();
        createMatrixRain();

        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        active = true;
        animate();
    }

    function createLights() {
        scene.add(new THREE.AmbientLight(0x101030, 0.5));
        const green = new THREE.PointLight(0x05d9e8, 0.8, 40);
        green.position.set(0, 0, 15);
        scene.add(green);
    }

    function createMatrixRain() {
        const charCount = isMobile ? 200 : 500;
        const cols = 30;
        const charsPerCol = Math.floor(charCount / cols);
        for (let c = 0; c < cols; c++) {
            const x = (c / cols - 0.5) * 60;
            for (let i = 0; i < charsPerCol; i++) {
                const geom = new THREE.BoxGeometry(0.2, 0.4, 0.05);
                const mat = new THREE.MeshBasicMaterial({
                    color: 0x05d9e8,
                    transparent: true,
                    opacity: Math.random() * 0.6 + 0.2
                });
                const m = new THREE.Mesh(geom, mat);
                m.position.set(x, Math.random() * 40 - 20, (Math.random() - 0.5) * 20);
                m.userData = {
                    speed: 4 + Math.random() * 8,
                    baseX: x
                };
                scene.add(m);
                rainDrops.push(m);
            }
        }
    }

    function onResize() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onMouseMove(e) {
        mouseTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    function animate() {
        if (!active) return;
        requestAnimationFrame(animate);
        const dt = clock.getDelta();
        const t = clock.getElapsedTime();

        mouse.x += (mouseTarget.x - mouse.x) * 0.03;
        mouse.y += (mouseTarget.y - mouse.y) * 0.03;
        camera.position.x = mouse.x * 3;
        camera.position.y = mouse.y * 1.5;
        camera.lookAt(0, 0, 0);

        rainDrops.forEach((d, i) => {
            d.position.y -= dt * d.userData.speed;
            if (d.position.y < -20) {
                d.position.y = 20;
            }
            d.material.opacity = 0.3 + Math.sin(t * 2 + i) * 0.3;
        });

        renderer.render(scene, camera);
    }

    function stop() { active = false; if (renderer) renderer.dispose(); }

    global.DashboardScene = { init, stop };
})(window);
