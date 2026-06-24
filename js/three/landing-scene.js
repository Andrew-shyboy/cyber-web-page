/* ===== 首页 3D 场景 ===== */
(function (global) {
    'use strict';

    let scene, camera, renderer, clock;
    let grid, buildings, particles, scanLines;
    let mouseTarget = { x: 0, y: 0 };
    let mouse = { x: 0, y: 0 };
    let active = false;
    let isMobile = false;

    function init() {
        if (typeof THREE === 'undefined') return;
        isMobile = matchMedia('(max-width: 768px)').matches;
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x050510, 0.012);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 8, 30);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        clock = new THREE.Clock();

        createLights();
        createGrid();
        createCity();
        createParticles();
        createScanLines();

        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove, { passive: true });

        active = true;
        animate();
    }

    function createLights() {
        const ambient = new THREE.AmbientLight(0x404060, 0.4);
        scene.add(ambient);

        const pink = new THREE.PointLight(0xff2a6d, 1.5, 80);
        pink.position.set(-20, 20, 10);
        scene.add(pink);

        const cyan = new THREE.PointLight(0x05d9e8, 1.5, 80);
        cyan.position.set(20, 15, 10);
        scene.add(cyan);

        const purple = new THREE.PointLight(0xd300c5, 0.8, 60);
        purple.position.set(0, 5, -10);
        scene.add(purple);
    }

    function createGrid() {
        const size = 200;
        const div = 60;
        const gridHelper = new THREE.GridHelper(size, div, 0x05d9e8, 0x05d9e8);
        gridHelper.material.opacity = 0.25;
        gridHelper.material.transparent = true;
        gridHelper.position.y = -2;
        scene.add(gridHelper);
        grid = gridHelper;
    }

    function createCity() {
        buildings = new THREE.Group();
        const count = isMobile ? 40 : 80;
        for (let i = 0; i < count; i++) {
            const w = 1 + Math.random() * 3;
            const h = 4 + Math.random() * 22;
            const d = 1 + Math.random() * 3;
            const geom = new THREE.BoxGeometry(w, h, d);
            const color = Math.random() < 0.3 ? 0xff2a6d : 0x05d9e8;
            const mat = new THREE.MeshBasicMaterial({
                color: 0x0a0a1a,
                wireframe: true
            });
            const mesh = new THREE.Mesh(geom, mat);
            const angle = (i / count) * Math.PI * 2;
            const dist = 30 + Math.random() * 60;
            mesh.position.set(
                Math.cos(angle) * dist,
                h / 2 - 2,
                Math.sin(angle) * dist
            );
            mesh.userData = { baseY: mesh.position.y, color, speed: 0.3 + Math.random() * 0.6 };
            buildings.add(mesh);
        }
        scene.add(buildings);
    }

    function createParticles() {
        const count = isMobile ? 600 : 1500;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = Math.random() * 60 - 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            const c = Math.random();
            if (c < 0.33) { colors[i*3]=1; colors[i*3+1]=0.16; colors[i*3+2]=0.43; }
            else if (c < 0.66) { colors[i*3]=0.02; colors[i*3+1]=0.85; colors[i*3+2]=0.91; }
            else { colors[i*3]=0.83; colors[i*3+1]=0; colors[i*3+2]=0.77; }
        }
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        particles = new THREE.Points(geom, mat);
        scene.add(particles);
    }

    function createScanLines() {
        const geom = new THREE.PlaneGeometry(200, 1.5);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x05d9e8,
            transparent: true,
            opacity: 0.15
        });
        scanLines = new THREE.Mesh(geom, mat);
        scanLines.position.y = -2;
        scanLines.rotation.x = -Math.PI / 2;
        scene.add(scanLines);
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

        // 相机视差跟随
        mouse.x += (mouseTarget.x - mouse.x) * 0.05;
        mouse.y += (mouseTarget.y - mouse.y) * 0.05;
        camera.position.x = mouse.x * 4;
        camera.position.y = 8 + mouse.y * -2;
        camera.lookAt(0, 0, 0);

        // 网格脉动
        if (grid) {
            grid.material.opacity = 0.18 + Math.sin(t * 0.8) * 0.08;
        }

        // 建筑上下浮动
        if (buildings) {
            buildings.children.forEach((b, i) => {
                b.position.y = b.userData.baseY + Math.sin(t * b.userData.speed + i) * 0.3;
                if (b.material) {
                    const c = b.userData.color;
                    b.material.color.setHex(c);
                }
            });
        }

        // 粒子旋转
        if (particles) {
            particles.rotation.y += dt * 0.04;
            const pos = particles.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                let y = pos.array[i * 3 + 1];
                y -= dt * (1 + (i % 5) * 0.2);
                if (y < -5) y = 55;
                pos.array[i * 3 + 1] = y;
            }
            pos.needsUpdate = true;
        }

        // 扫描线扫过
        if (scanLines) {
            const localZ = ((t * 6) % 200) - 100;
            scanLines.position.z = localZ;
        }

        renderer.render(scene, camera);
    }

    function stop() {
        active = false;
        if (renderer) {
            renderer.dispose();
        }
    }

    global.LandingScene = { init, stop };
})(window);
