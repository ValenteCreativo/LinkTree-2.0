"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";

interface UniverseSceneProps {
  zoom: number;
}

const UniverseScene: React.FC<UniverseSceneProps> = ({ zoom }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000011, 0.0005);

    const camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      8000
    );
    camera.position.set(0, 50, 500);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    currentMount.appendChild(renderer.domElement);

    // Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.8;
    composer.addPass(bloomPass);

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    composer.addPass(fxaaPass);

    // Chromatic aberration shader
    const ChromaticAberrationShader = {
      uniforms: {
        tDiffuse: { value: null },
        amount: { value: 0.003 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float amount;
        varying vec2 vUv;
        void main() {
          vec2 offset = amount * (vUv - 0.5);
          float r = texture2D(tDiffuse, vUv + offset).r;
          float g = texture2D(tDiffuse, vUv).g;
          float b = texture2D(tDiffuse, vUv - offset).b;
          gl_FragColor = vec4(r, g, b, 1.0);
        }
      `,
    };
    const chromaticPass = new ShaderPass(ChromaticAberrationShader);
    composer.addPass(chromaticPass);

    // === STARFIELD with multiple layers ===
    const createStarLayer = (count: number, spread: number, size: number, color: number) => {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
        positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color,
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Points(geo, mat);
    };

    const starLayer1 = createStarLayer(8000, 3000, 1.0, 0xffffff);
    const starLayer2 = createStarLayer(4000, 4000, 1.8, 0xaaccff);
    const starLayer3 = createStarLayer(2000, 5000, 2.5, 0xffddaa);
    scene.add(starLayer1, starLayer2, starLayer3);

    // === NEBULA CLOUDS ===
    const createNebulaCloud = (
      color1: string,
      color2: string,
      size: number,
      position: THREE.Vector3
    ) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d")!;
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(0.4, color2);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.4,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(size, size, 1);
      sprite.position.copy(position);
      return sprite;
    };

    const nebulaGroup = new THREE.Group();
    const nebulaConfigs = [
      { c1: "rgba(0,230,118,0.6)", c2: "rgba(0,100,50,0.2)", size: 300, pos: new THREE.Vector3(-400, 100, -500) },
      { c1: "rgba(68,138,255,0.5)", c2: "rgba(30,60,120,0.2)", size: 400, pos: new THREE.Vector3(300, -100, -600) },
      { c1: "rgba(124,77,255,0.5)", c2: "rgba(60,30,100,0.2)", size: 350, pos: new THREE.Vector3(0, 200, -800) },
      { c1: "rgba(255,64,129,0.4)", c2: "rgba(100,20,50,0.15)", size: 250, pos: new THREE.Vector3(-300, -200, -400) },
      { c1: "rgba(0,200,200,0.4)", c2: "rgba(0,60,80,0.15)", size: 280, pos: new THREE.Vector3(400, 150, -700) },
      { c1: "rgba(255,215,0,0.3)", c2: "rgba(80,60,0,0.1)", size: 200, pos: new THREE.Vector3(-200, -150, -350) },
    ];
    nebulaConfigs.forEach((n) => {
      nebulaGroup.add(createNebulaCloud(n.c1, n.c2, n.size, n.pos));
    });
    scene.add(nebulaGroup);

    // === SPIRAL GALAXY (enhanced) ===
    const createGalaxy = () => {
      const count = 25000;
      const radius = 350;
      const branches = 5;
      const spin = 1.5;
      const randomness = 0.3;
      const randomnessPower = 3;
      const insideColor = new THREE.Color(0x00e676);
      const outsideColor = new THREE.Color(0x448aff);

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = Math.random() * radius;
        const branchAngle = ((i % branches) / branches) * Math.PI * 2;
        const spinAngle = r * spin;

        const randomX =
          Math.pow(Math.random(), randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) * randomness * r;
        const randomY =
          Math.pow(Math.random(), randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.3;
        const randomZ =
          Math.pow(Math.random(), randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) * randomness * r;

        positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

        const mixedColor = insideColor.clone();
        mixedColor.lerp(outsideColor, r / radius);
        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;

        sizes[i] = Math.random() * 2 + 0.5;
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.9,
      });

      return new THREE.Points(geometry, material);
    };

    const galaxy = createGalaxy();
    galaxy.position.set(-300, -50, -200);
    galaxy.rotation.x = Math.PI * 0.15;
    scene.add(galaxy);

    // === SECOND DISTANT GALAXY ===
    const createMiniGalaxy = () => {
      const count = 8000;
      const radius = 150;
      const branches = 3;
      const insideColor = new THREE.Color(0xff4081);
      const outsideColor = new THREE.Color(0x7c4dff);

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = Math.random() * radius;
        const branchAngle = ((i % branches) / branches) * Math.PI * 2;
        const spinAngle = r * 2;
        const rp = 3;

        positions[i3] = Math.cos(branchAngle + spinAngle) * r +
          Math.pow(Math.random(), rp) * (Math.random() < 0.5 ? 1 : -1) * 0.25 * r;
        positions[i3 + 1] =
          Math.pow(Math.random(), rp) * (Math.random() < 0.5 ? 1 : -1) * 0.1 * r;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r +
          Math.pow(Math.random(), rp) * (Math.random() < 0.5 ? 1 : -1) * 0.25 * r;

        const mixedColor = insideColor.clone();
        mixedColor.lerp(outsideColor, r / radius);
        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.7,
      });

      return new THREE.Points(geometry, material);
    };

    const miniGalaxy = createMiniGalaxy();
    miniGalaxy.position.set(500, 200, -1000);
    miniGalaxy.rotation.x = Math.PI * 0.3;
    miniGalaxy.rotation.z = Math.PI * 0.2;
    scene.add(miniGalaxy);

    // === PLANET with atmosphere ===
    const planetGroup = new THREE.Group();
    planetGroup.position.set(250, -80, -400);

    const planetGeo = new THREE.SphereGeometry(45, 64, 64);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a5c,
      emissive: 0x0a1a2c,
      metalness: 0.4,
      roughness: 0.6,
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planet);

    // Atmosphere glow
    const atmosphereGeo = new THREE.SphereGeometry(48, 64, 64);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x00e676,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    planetGroup.add(atmosphere);

    // Ring system
    const ringGeo = new THREE.RingGeometry(55, 90, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x448aff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.2;
    planetGroup.add(ringMesh);

    scene.add(planetGroup);

    // === FLOATING PARTICLES (cosmic dust) ===
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 3000;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 1500;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 1500;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 1500;
      dustVelocities[i * 3] = (Math.random() - 0.5) * 0.2;
      dustVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x00e676,
      size: 0.8,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const cosmicDust = new THREE.Points(dustGeo, dustMat);
    scene.add(cosmicDust);

    // === COMETS (multiple) ===
    const comets: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; yOffset: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const cometGeo = new THREE.SphereGeometry(3 + Math.random() * 3, 12, 12);
      const cometMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
      });
      const cometMesh = new THREE.Mesh(cometGeo, cometMat);
      scene.add(cometMesh);
      comets.push({
        mesh: cometMesh,
        angle: Math.random() * Math.PI * 2,
        radius: 500 + Math.random() * 400,
        speed: 0.002 + Math.random() * 0.003,
        yOffset: (Math.random() - 0.5) * 200,
      });
    }

    // === LIGHTING ===
    scene.add(new THREE.AmbientLight(0x111122, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 100);
    scene.add(dirLight);
    const greenLight = new THREE.PointLight(0x00e676, 0.8, 600);
    greenLight.position.set(-200, 100, -100);
    scene.add(greenLight);
    const blueLight = new THREE.PointLight(0x448aff, 0.6, 500);
    blueLight.position.set(200, -50, -200);
    scene.add(blueLight);

    // === ANIMATION ===
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Star layers rotation
      starLayer1.rotation.y += 0.0001;
      starLayer2.rotation.y -= 0.00015;
      starLayer3.rotation.y += 0.00008;
      starLayer1.rotation.x += 0.00005;

      // Nebula breathing
      nebulaGroup.rotation.y += 0.0001;
      nebulaGroup.children.forEach((child, i) => {
        const sprite = child as THREE.Sprite;
        const scale = 1 + 0.05 * Math.sin(elapsed * 0.3 + i);
        sprite.scale.setScalar(
          (nebulaConfigs[i]?.size || 200) * scale
        );
      });

      // Galaxy rotation
      galaxy.rotation.y += 0.0003;
      miniGalaxy.rotation.y -= 0.0005;

      // Planet rotation
      planet.rotation.y += 0.002;
      ringMesh.rotation.z += 0.001;

      // Cosmic dust animation
      const dustPos = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        dustPos.array[i * 3] += dustVelocities[i * 3] * Math.sin(elapsed * 0.5 + i);
        dustPos.array[i * 3 + 1] += dustVelocities[i * 3 + 1] * Math.cos(elapsed * 0.3 + i);
      }
      dustPos.needsUpdate = true;
      cosmicDust.rotation.y += 0.0002;

      // Comets
      comets.forEach((comet) => {
        comet.angle += comet.speed;
        comet.mesh.position.set(
          comet.radius * Math.cos(comet.angle),
          comet.yOffset + 30 * Math.sin(elapsed * 0.5),
          comet.radius * Math.sin(comet.angle)
        );
      });

      // Camera movement
      const zoomVal = zoomRef.current;
      camera.position.z = 500 - zoomVal * 300;
      camera.position.x = 20 * Math.sin(elapsed * 0.08);
      camera.position.y = 50 + 15 * Math.cos(elapsed * 0.06);
      camera.lookAt(0, 0, 0);

      // Dynamic bloom based on zoom
      bloomPass.strength = 1.2 + zoomVal * 0.5;

      composer.render();
    };
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      fxaaPass.uniforms["resolution"].value.set(
        1 / window.innerWidth,
        1 / window.innerHeight
      );
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
    />
  );
};

export default UniverseScene;
