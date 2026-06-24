/* ===== 公开个人页 3D 场景 ===== */
(function (global) {
    'use strict';

    let scene, camera, renderer, clock;
    let stars, rings;
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
        scene.fog = new THREE.FogExp2(0x050510, 0.02);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 20);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        clock = new THREE.Clock();

        createLights();
        createStars();
        createRings();

        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        active = true;
        animate();
    }

    function createLights() {
        scene.add(new THREE.AmbientLight(0x303050, 0.5));
        const p1 = new THREE.PointLight(0xff2a6d, 1, 50);
        p1.position.set(-10, 5, 5);
        scene.add(p1);
        const p2 = new THREE.PointLight(0x05d9e8, 1, 50);
        p2.position.set(10, -5, 5);
        scene.add(p2);
    }

    function createStars() {
        const count = isMobile ? 800 : 2000;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
            const c = Math.random();
            if (c < 0.5) { colors[i*3]=0.02; colors[i*3+1]=0.85; colors[i*3+2]=0.91; }
            else if (c < 0.85) { colors[i*3]=1; colors[i*3+1]=0.16; colors[i*3+2]=0.43; }
            else { colors[i*3]=0.83; colors[i*3+1]=0; colors[i*3+2]=0.77; }
        }
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({
            size: 0.12,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
        });
        stars = new THREE.Points(geom, mat);
        scene.add(stars);
    }

    function createRings() {
        rings = new THREE.Group();
        for (let i = 0; i < 3; i++) {
            const geom = new THREE.TorusGeometry(6 + i * 2, 0.05, 8, 64);
            const mat = new THREE.MeshBasicMaterial({
                color: i === 0 ? 0xff2a6d : (i === 1 ? 0x05d9e8 : 0xd300c5),
                transparent: true,
                opacity: 0.4
            });
            const ring = new THREE.Mesh(geom, mat);
            ring.rotation.x = Math.PI / 2 + (i - 1) * 0.3;
            ring.userData = { speed: 0.1 + i * 0.05 };
            rings.add(ring);
        }
        scene.add(rings);
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

        mouse.x += (mouseTarget.x - mouse.x) * 0.04;
        mouse.y += (mouseTarget.y - mouse.y) * 0.04;
        camera.position.x = mouse.x * 2;
        camera.position.y = mouse.y * 1;
        camera.lookAt(0, 0, 0);

        if (stars) {
            stars.rotation.y += dt * 0.02;
            stars.rotation.x += dt * 0.005;
        }

        if (rings) {
            rings.rotation.z += dt * 0.05;
            rings.children.forEach(r => r.rotation.z += dt * r.userData.speed);
        }

        renderer.render(scene, camera);
    }

    function stop() { active = false; if (renderer) renderer.dispose(); }

    global.ResumeScene = { init, stop };
})(window);
