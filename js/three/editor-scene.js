/* ===== 编辑器 3D 场景（轻量） ===== */
(function (global) {
    'use strict';

    let scene, camera, renderer, clock;
    let shapes, particles;
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
        camera.position.set(0, 0, 24);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        clock = new THREE.Clock();

        createLights();
        createShapes();
        createParticles();

        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        active = true;
        animate();
    }

    function createLights() {
        scene.add(new THREE.AmbientLight(0x404060, 0.4));
        const pink = new THREE.PointLight(0xff2a6d, 1.2, 50);
        pink.position.set(-15, 10, 10);
        scene.add(pink);
        const cyan = new THREE.PointLight(0x05d9e8, 1.2, 50);
        cyan.position.set(15, -10, 10);
        scene.add(cyan);
    }

    function createShapes() {
        shapes = new THREE.Group();
        const count = isMobile ? 6 : 12;
        for (let i = 0; i < count; i++) {
            const type = Math.floor(Math.random() * 3);
            let geom;
            if (type === 0) geom = new THREE.IcosahedronGeometry(1.5 + Math.random() * 1.5, 0);
            else if (type === 1) geom = new THREE.TorusGeometry(1.2 + Math.random(), 0.3, 8, 16);
            else geom = new THREE.OctahedronGeometry(1.2 + Math.random(), 0);

            const wireMat = new THREE.MeshBasicMaterial({
                color: Math.random() < 0.5 ? 0xff2a6d : 0x05d9e8,
                wireframe: true,
                transparent: true,
                opacity: 0.6
            });
            const mesh = new THREE.Mesh(geom, wireMat);
            mesh.position.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 18,
                (Math.random() - 0.5) * 10
            );
            mesh.userData = {
                rotSpeed: {
                    x: (Math.random() - 0.5) * 0.5,
                    y: (Math.random() - 0.5) * 0.5,
                    z: (Math.random() - 0.5) * 0.3
                },
                floatSpeed: 0.4 + Math.random() * 0.6,
                baseY: mesh.position.y
            };
            shapes.add(mesh);
        }
        scene.add(shapes);
    }

    function createParticles() {
        const count = isMobile ? 300 : 700;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            size: 0.08,
            color: 0x05d9e8,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        particles = new THREE.Points(geom, mat);
        scene.add(particles);
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

        if (shapes) {
            shapes.children.forEach(s => {
                s.rotation.x += dt * s.userData.rotSpeed.x;
                s.rotation.y += dt * s.userData.rotSpeed.y;
                s.rotation.z += dt * s.userData.rotSpeed.z;
                s.position.y = s.userData.baseY + Math.sin(t * s.userData.floatSpeed) * 0.6;
            });
        }

        if (particles) {
            particles.rotation.y += dt * 0.02;
        }

        renderer.render(scene, camera);
    }

    function stop() { active = false; if (renderer) renderer.dispose(); }

    global.EditorScene = { init, stop };
})(window);
