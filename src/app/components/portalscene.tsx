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

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000005, 0.00035);

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
    renderer.toneMappingExposure = 1.0;
    currentMount.appendChild(renderer.domElement);

    // Post-processing — minimal bloom, no blur
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.6,
      0.1,
      0.9
    );
    bloomPass.threshold = 0.4;
    bloomPass.strength = 0.5;
    bloomPass.radius = 0.2;
    composer.addPass(bloomPass);

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    composer.addPass(fxaaPass);

    // === STARFIELD — crisp dots ===
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
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Points(geo, mat);
    };

    const starLayer1 = createStarLayer(10000, 3000, 0.8, 0xffffff);
    const starLayer2 = createStarLayer(4000, 4000, 1.2, 0xccddff);
    const starLayer3 = createStarLayer(1500, 5000, 1.8, 0xffeedd);
    scene.add(starLayer1, starLayer2, starLayer3);

    // === NEBULA — subtle, not overwhelming ===
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
      gradient.addColorStop(0.5, color2);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.15,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(size, size, 1);
      sprite.position.copy(position);
      return sprite;
    };

    const nebulaGroup = new THREE.Group();
    const nebulaConfigs = [
      { c1: "rgba(0,180,100,0.3)", c2: "rgba(0,60,30,0.1)", size: 350, pos: new THREE.Vector3(-500, 100, -700) },
      { c1: "rgba(50,100,200,0.25)", c2: "rgba(20,40,80,0.08)", size: 400, pos: new THREE.Vector3(400, -150, -800) },
      { c1: "rgba(100,60,180,0.2)", c2: "rgba(40,20,70,0.06)", size: 300, pos: new THREE.Vector3(0, 250, -900) },
    ];
    nebulaConfigs.forEach((n) => {
      nebulaGroup.add(createNebulaCloud(n.c1, n.c2, n.size, n.pos));
    });
    scene.add(nebulaGroup);

    // === SPIRAL GALAXY ===
    const createGalaxy = () => {
      const count = 20000;
      const radius = 300;
      const branches = 5;
      const spin = 1.5;
      const randomness = 0.25;
      const randomnessPower = 3;
      const insideColor = new THREE.Color(0xffffff);
      const outsideColor = new THREE.Color(0x4488ff);

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

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
          (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.2;
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
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.9,
        vertexColors: true,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.85,
      });

      return new THREE.Points(geometry, material);
    };

    const galaxy = createGalaxy();
    galaxy.position.set(-350, -80, -300);
    galaxy.rotation.x = Math.PI * 0.2;
    scene.add(galaxy);

    // === PLANET with rings ===
    const planetGroup = new THREE.Group();
    planetGroup.position.set(300, -100, -500);

    const planetGeo = new THREE.SphereGeometry(40, 64, 64);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a6a,
      emissive: 0x0a1520,
      metalness: 0.3,
      roughness: 0.7,
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planet);

    const ringGeo = new THREE.RingGeometry(50, 80, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6688aa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    planetGroup.add(ringMesh);
    scene.add(planetGroup);

    // === COMETS ===
    const comets: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; yOffset: number }[] = [];
    for (let i = 0; i < 2; i++) {
      const cometGeo = new THREE.SphereGeometry(2, 10, 10);
      const cometMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });
      const cometMesh = new THREE.Mesh(cometGeo, cometMat);
      scene.add(cometMesh);
      comets.push({
        mesh: cometMesh,
        angle: Math.random() * Math.PI * 2,
        radius: 600 + Math.random() * 300,
        speed: 0.001 + Math.random() * 0.002,
        yOffset: (Math.random() - 0.5) * 200,
      });
    }

    // === LIGHTING — natural space look ===
    scene.add(new THREE.AmbientLight(0x111122, 0.3));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(100, 200, 100);
    scene.add(dirLight);

    // === ANIMATION ===
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      starLayer1.rotation.y += 0.00008;
      starLayer2.rotation.y -= 0.0001;
      starLayer3.rotation.y += 0.00005;

      nebulaGroup.rotation.y += 0.00005;

      galaxy.rotation.y += 0.0002;

      planet.rotation.y += 0.001;
      ringMesh.rotation.z += 0.0005;

      comets.forEach((comet) => {
        comet.angle += comet.speed;
        comet.mesh.position.set(
          comet.radius * Math.cos(comet.angle),
          comet.yOffset + 20 * Math.sin(elapsed * 0.3),
          comet.radius * Math.sin(comet.angle)
        );
      });

      // Camera
      const zoomVal = zoomRef.current;
      camera.position.z = 500 - zoomVal * 300;
      camera.position.x = 12 * Math.sin(elapsed * 0.06);
      camera.position.y = 50 + 10 * Math.cos(elapsed * 0.04);
      camera.lookAt(0, 0, 0);

      composer.render();
    };
    animate();

    // Resize
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
