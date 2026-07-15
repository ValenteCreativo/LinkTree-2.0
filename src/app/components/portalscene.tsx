"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";

interface UniverseSceneProps {
  zoom: number;
}

export interface UniverseSceneHandle {
  fire: () => void;
  steer: (x: number, y: number) => void;
}

// Laser color palette — cycles after every few shots
const LASER_COLORS = [
  [0x00ffff, 0x00ccff], // cyan
  [0x00ff88, 0x44ffaa], // green
  [0xff00ff, 0xff44cc], // magenta
  [0xffcc00, 0xffee44], // gold
  [0xff4444, 0xff8844], // red-orange
  [0x8844ff, 0xaa66ff], // purple
];

const UniverseScene = forwardRef<UniverseSceneHandle, UniverseSceneProps>(({ zoom }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const shotCountRef = useRef(0);
  const steerRef = useRef({ x: 0, y: 0 });

  // Laser beam data
  interface LaserBeam {
    mesh: THREE.Mesh;
    glow: THREE.Mesh;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    color: number;
  }

  const lasersRef = useRef<LaserBeam[]>([]);

  const fire = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    console.log("🚀 FIRE! Shot #" + (shotCountRef.current + 1));

    shotCountRef.current++;
    // Pick color palette based on shot count (changes every 3 shots)
    const paletteIndex = Math.floor((shotCountRef.current - 1) / 3) % LASER_COLORS.length;
    const [coreColor, glowColor] = LASER_COLORS[paletteIndex];

    // Fire 2 beams — left and right turrets, wide apart on the ship sides
    const offsets = [-120, 120];
    offsets.forEach((offsetX) => {
      // Start in front of camera, low and wide (turrets on each side of the ship)
      const startPos = new THREE.Vector3(
        offsetX + (Math.random() - 0.5) * 3,
        20,
        480
      );

      // Velocity converging slightly toward center as they fly to horizon
      const velocity = new THREE.Vector3(
        -offsetX * 0.02 + (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.3,
        -(20 + Math.random() * 5)
      );

      // Laser core — elongated cylinder
      const laserGeo = new THREE.CylinderGeometry(1.5, 1.0, 50, 8);
      laserGeo.rotateX(Math.PI / 2);
      const laserMat = new THREE.MeshBasicMaterial({
        color: coreColor,
        transparent: true,
        opacity: 1,
      });
      const laserMesh = new THREE.Mesh(laserGeo, laserMat);
      laserMesh.position.copy(startPos);
      scene.add(laserMesh);

      // Glow around laser
      const glowGeo = new THREE.CylinderGeometry(5, 4, 55, 8);
      glowGeo.rotateX(Math.PI / 2);
      const glowMat = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.copy(startPos);
      scene.add(glowMesh);

      lasersRef.current.push({
        mesh: laserMesh,
        glow: glowMesh,
        position: startPos.clone(),
        velocity: velocity.clone(),
        life: 0,
        maxLife: 80,
        color: coreColor,
      });
    });
  }, []);

  useImperativeHandle(ref, () => ({
    fire,
    steer: (x: number, y: number) => {
      steerRef.current = { x, y };
    },
  }), [fire]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

    // === SCENE ===
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000008, 0.00025);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    camera.position.set(0, 80, 500);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    currentMount.appendChild(renderer.domElement);

    // === POST-PROCESSING (sharp, no blur) ===
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8,
      0.15,
      0.85
    );
    bloomPass.threshold = 0.3;
    bloomPass.strength = 0.6;
    bloomPass.radius = 0.25;
    composer.addPass(bloomPass);

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    composer.addPass(fxaaPass);

    // =============================================
    // STARFIELD — massive, layered, realistic
    // =============================================
    const createStarLayer = (
      count: number,
      spread: number,
      size: number,
      color: number,
      opacity: number
    ) => {
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
        opacity,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Points(geo, mat);
    };

    // Dense background stars (tiny, white)
    const starsDeep = createStarLayer(15000, 5000, 0.6, 0xffffff, 0.7);
    // Mid-field stars (slight blue tint)
    const starsMid = createStarLayer(6000, 3500, 1.0, 0xddeeff, 0.85);
    // Foreground bright stars (warm)
    const starsNear = createStarLayer(2000, 2000, 1.6, 0xfff8ee, 1.0);
    // Colored accent stars
    const starsBlue = createStarLayer(800, 4000, 2.0, 0x6699ff, 0.6);
    const starsOrange = createStarLayer(500, 4000, 1.8, 0xffaa44, 0.5);
    scene.add(starsDeep, starsMid, starsNear, starsBlue, starsOrange);

    // =============================================
    // NEBULAE — multiple, subtle, volumetric feel
    // =============================================
    const createNebula = (
      colors: { stop: number; color: string }[],
      size: number,
      position: THREE.Vector3,
      opacity: number
    ) => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d")!;
      const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
      colors.forEach((c) => gradient.addColorStop(c.stop, c.color));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(size, size, 1);
      sprite.position.copy(position);
      return sprite;
    };

    const nebulaGroup = new THREE.Group();

    // Large blue/purple nebula — background
    nebulaGroup.add(
      createNebula(
        [
          { stop: 0, color: "rgba(60,80,180,0.5)" },
          { stop: 0.3, color: "rgba(30,20,80,0.3)" },
          { stop: 0.7, color: "rgba(10,5,30,0.1)" },
          { stop: 1, color: "rgba(0,0,0,0)" },
        ],
        600,
        new THREE.Vector3(-400, 150, -1200),
        0.2
      )
    );
    // Green/teal emission nebula
    nebulaGroup.add(
      createNebula(
        [
          { stop: 0, color: "rgba(0,200,120,0.4)" },
          { stop: 0.4, color: "rgba(0,80,60,0.2)" },
          { stop: 1, color: "rgba(0,0,0,0)" },
        ],
        450,
        new THREE.Vector3(500, -100, -1000),
        0.15
      )
    );
    // Pink/magenta nebula
    nebulaGroup.add(
      createNebula(
        [
          { stop: 0, color: "rgba(200,50,120,0.35)" },
          { stop: 0.5, color: "rgba(80,10,40,0.15)" },
          { stop: 1, color: "rgba(0,0,0,0)" },
        ],
        500,
        new THREE.Vector3(0, 300, -1500),
        0.12
      )
    );
    // Gold dust cloud
    nebulaGroup.add(
      createNebula(
        [
          { stop: 0, color: "rgba(255,200,50,0.3)" },
          { stop: 0.5, color: "rgba(120,60,0,0.1)" },
          { stop: 1, color: "rgba(0,0,0,0)" },
        ],
        350,
        new THREE.Vector3(-300, -250, -800),
        0.1
      )
    );
    // Small cyan wisp
    nebulaGroup.add(
      createNebula(
        [
          { stop: 0, color: "rgba(0,220,255,0.4)" },
          { stop: 0.6, color: "rgba(0,60,100,0.1)" },
          { stop: 1, color: "rgba(0,0,0,0)" },
        ],
        250,
        new THREE.Vector3(350, 200, -600),
        0.18
      )
    );
    // Distant red cloud
    nebulaGroup.add(
      createNebula(
        [
          { stop: 0, color: "rgba(180,30,30,0.25)" },
          { stop: 0.5, color: "rgba(60,5,5,0.1)" },
          { stop: 1, color: "rgba(0,0,0,0)" },
        ],
        700,
        new THREE.Vector3(200, -200, -2000),
        0.08
      )
    );

    scene.add(nebulaGroup);

    // =============================================
    // SPIRAL GALAXY — large, detailed
    // =============================================
    const createGalaxy = (
      count: number,
      radius: number,
      branches: number,
      spin: number,
      colorInside: THREE.Color,
      colorOutside: THREE.Color,
      position: THREE.Vector3,
      rotationX: number,
      rotationZ: number
    ) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const randomnessPower = 3;
      const randomness = 0.3;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = Math.random() * radius;
        const branchAngle = ((i % branches) / branches) * Math.PI * 2;
        const spinAngle = r * spin;

        const rx = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
        const ry = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.15;
        const rz = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;

        positions[i3] = Math.cos(branchAngle + spinAngle) * r + rx;
        positions[i3 + 1] = ry;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + rz;

        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, r / radius);
        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 1.0,
        vertexColors: true,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.85,
      });

      const galaxy = new THREE.Points(geometry, material);
      galaxy.position.copy(position);
      galaxy.rotation.x = rotationX;
      galaxy.rotation.z = rotationZ;
      return galaxy;
    };

    // Main galaxy — white/blue, large
    const galaxyMain = createGalaxy(
      25000, 350, 5, 1.5,
      new THREE.Color(0xffffff),
      new THREE.Color(0x3366cc),
      new THREE.Vector3(-300, -50, -400),
      Math.PI * 0.2, 0
    );
    scene.add(galaxyMain);

    // Secondary galaxy — pink/purple, distant, tilted
    const galaxySecondary = createGalaxy(
      10000, 200, 3, 2.0,
      new THREE.Color(0xff88cc),
      new THREE.Color(0x5522aa),
      new THREE.Vector3(600, 250, -1500),
      Math.PI * 0.4, Math.PI * 0.15
    );
    scene.add(galaxySecondary);

    // Tiny distant galaxy
    const galaxyTiny = createGalaxy(
      5000, 100, 4, 1.8,
      new THREE.Color(0xffffee),
      new THREE.Color(0xffaa33),
      new THREE.Vector3(-700, -300, -2000),
      Math.PI * 0.1, Math.PI * 0.3
    );
    scene.add(galaxyTiny);

    // =============================================
    // PLANETS
    // =============================================

    // Planet 1 — Saturn-like with ring
    const planet1Group = new THREE.Group();
    planet1Group.position.set(250, -80, -500);

    const planet1Geo = new THREE.SphereGeometry(50, 64, 64);
    const planet1Mat = new THREE.MeshStandardMaterial({
      color: 0xf4e1c1,
      emissive: 0x1a0e05,
      metalness: 0.2,
      roughness: 0.8,
    });
    const planet1 = new THREE.Mesh(planet1Geo, planet1Mat);
    planet1Group.add(planet1);

    // Ring
    const ring1Geo = new THREE.RingGeometry(62, 100, 128);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0xbbaa88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2.2;
    planet1Group.add(ring1);
    scene.add(planet1Group);

    // Planet 2 — Blue/green, Earth-like
    const planet2Geo = new THREE.SphereGeometry(30, 48, 48);
    const planet2Mat = new THREE.MeshStandardMaterial({
      color: 0x2266aa,
      emissive: 0x051520,
      metalness: 0.1,
      roughness: 0.9,
    });
    const planet2 = new THREE.Mesh(planet2Geo, planet2Mat);
    planet2.position.set(-450, 120, -700);
    scene.add(planet2);

    // Planet 2 atmosphere
    const atmo2Geo = new THREE.SphereGeometry(33, 48, 48);
    const atmo2Mat = new THREE.MeshBasicMaterial({
      color: 0x44aaff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atmo2 = new THREE.Mesh(atmo2Geo, atmo2Mat);
    atmo2.position.copy(planet2.position);
    scene.add(atmo2);

    // Planet 3 — Small red/orange, distant
    const planet3Geo = new THREE.SphereGeometry(18, 32, 32);
    const planet3Mat = new THREE.MeshStandardMaterial({
      color: 0xcc4422,
      emissive: 0x220a05,
      metalness: 0.3,
      roughness: 0.6,
    });
    const planet3 = new THREE.Mesh(planet3Geo, planet3Mat);
    planet3.position.set(500, -200, -900);
    scene.add(planet3);

    // =============================================
    // ASTEROID BELT around planet 1
    // =============================================
    const asteroidBelt = new THREE.Group();
    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * Math.PI * 2;
      const beltRadius = 110 + Math.random() * 40;
      const x = Math.cos(angle) * beltRadius;
      const z = Math.sin(angle) * beltRadius;
      const y = (Math.random() - 0.5) * 15;
      const size = Math.random() * 2 + 0.5;
      const asteroidGeo = new THREE.SphereGeometry(size, 6, 6);
      const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
      const asteroid = new THREE.Mesh(asteroidGeo, asteroidMat);
      asteroid.position.set(x, y, z);
      asteroid.userData.rotSpeed = {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
      };
      asteroidBelt.add(asteroid);
    }
    asteroidBelt.position.copy(planet1Group.position);
    scene.add(asteroidBelt);

    // =============================================
    // COMETS — multiple with trails (orbital)
    // =============================================
    interface CometData {
      mesh: THREE.Mesh;
      trail: THREE.Line;
      angle: number;
      radius: number;
      speed: number;
      yBase: number;
      yWave: number;
      trailPositions: Float32Array;
    }

    const comets: CometData[] = [];
    for (let i = 0; i < 6; i++) {
      // Comet head — glowing
      const cometGeo = new THREE.SphereGeometry(2.0 + Math.random() * 2.5, 12, 12);
      const cometMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const cometMesh = new THREE.Mesh(cometGeo, cometMat);
      scene.add(cometMesh);

      // Comet glow
      const glowGeo = new THREE.SphereGeometry(5 + Math.random() * 3, 12, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.15,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      cometMesh.add(glowMesh);

      // Comet trail — longer
      const trailCount = 50;
      const trailPositions = new Float32Array(trailCount * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
      const trailMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0xaaddff : 0xffddaa,
        transparent: true,
        opacity: 0.5,
      });
      const trail = new THREE.Line(trailGeo, trailMat);
      scene.add(trail);

      comets.push({
        mesh: cometMesh,
        trail,
        angle: Math.random() * Math.PI * 2,
        radius: 400 + Math.random() * 800,
        speed: 0.002 + Math.random() * 0.005,
        yBase: (Math.random() - 0.5) * 400,
        yWave: 30 + Math.random() * 50,
        trailPositions,
      });
    }

    // =============================================
    // SHOOTING STARS — fast streaks across the sky
    // =============================================
    interface ShootingStar {
      mesh: THREE.Mesh;
      trail: THREE.Line;
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      life: number;
      maxLife: number;
      trailPositions: Float32Array;
      active: boolean;
    }

    const shootingStars: ShootingStar[] = [];
    const SHOOTING_STAR_COUNT = 8;

    const resetShootingStar = (star: ShootingStar) => {
      // Random spawn on edges of the visible scene
      const side = Math.random();
      if (side < 0.5) {
        star.position.set(
          (Math.random() - 0.5) * 2000,
          400 + Math.random() * 300,
          -200 - Math.random() * 1000
        );
        star.velocity.set(
          (Math.random() - 0.5) * 8,
          -(3 + Math.random() * 5),
          -(Math.random() * 3)
        );
      } else {
        star.position.set(
          -1000 + Math.random() * 500,
          (Math.random() - 0.5) * 600,
          -200 - Math.random() * 800
        );
        star.velocity.set(
          5 + Math.random() * 6,
          (Math.random() - 0.5) * 3,
          -(Math.random() * 2)
        );
      }
      star.life = 0;
      star.maxLife = 60 + Math.random() * 90;
      star.active = true;
      // Clear trail
      star.trailPositions.fill(0);
    };

    for (let i = 0; i < SHOOTING_STAR_COUNT; i++) {
      const starGeo = new THREE.SphereGeometry(1.2, 6, 6);
      const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const starMesh = new THREE.Mesh(starGeo, starMat);
      scene.add(starMesh);

      const trailCount = 20;
      const trailPositions = new Float32Array(trailCount * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
      const trailMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
      });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      scene.add(trailLine);

      const star: ShootingStar = {
        mesh: starMesh,
        trail: trailLine,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 100,
        trailPositions,
        active: false,
      };
      // Stagger activation
      setTimeout(() => resetShootingStar(star), i * 2000 + Math.random() * 3000);
      shootingStars.push(star);
    }



    // =============================================
    // COSMIC DUST particles
    // =============================================
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 2000;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 2000;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x88aacc,
      size: 0.5,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    const cosmicDust = new THREE.Points(dustGeo, dustMat);
    scene.add(cosmicDust);

    // =============================================
    // LIGHTING
    // =============================================
    scene.add(new THREE.AmbientLight(0x0a0a1a, 0.4));

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.7);
    sunLight.position.set(200, 300, 200);
    scene.add(sunLight);

    const rimLight = new THREE.PointLight(0x4488ff, 0.5, 800);
    rimLight.position.set(-300, 100, -200);
    scene.add(rimLight);

    const warmLight = new THREE.PointLight(0xffcc66, 0.3, 600);
    warmLight.position.set(300, -100, 100);
    scene.add(warmLight);

    // =============================================
    // DISTANT STAR (sun) with lens flare glow
    // =============================================
    // Generate a radial gradient texture for smooth circular glow
    const makeGlowTexture = (size: number, coreColor: string, edgeColor: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const half = size / 2;
      const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
      grad.addColorStop(0, coreColor);
      grad.addColorStop(0.2, coreColor);
      grad.addColorStop(0.5, edgeColor);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(canvas);
    };

    const starGlow = new THREE.Group();

    // Core — small bright point
    const coreTexture = makeGlowTexture(64, "rgba(255,255,255,1)", "rgba(255,250,230,0)");
    const coreMat = new THREE.SpriteMaterial({
      map: coreTexture,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });
    const starCore = new THREE.Sprite(coreMat);
    starCore.scale.set(12, 12, 1);
    starGlow.add(starCore);

    // Soft halo layers with radial textures
    const haloSizes = [30, 60, 120];
    const haloOpacities = [0.12, 0.05, 0.02];
    const haloColors = [
      ["rgba(255,245,220,0.8)", "rgba(255,200,100,0)"],
      ["rgba(255,230,200,0.5)", "rgba(200,150,80,0)"],
      ["rgba(255,220,180,0.3)", "rgba(150,100,50,0)"],
    ];
    haloSizes.forEach((size, i) => {
      const tex = makeGlowTexture(128, haloColors[i][0], haloColors[i][1]);
      const haloMat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: haloOpacities[i],
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Sprite(haloMat);
      halo.scale.set(size, size, 1);
      starGlow.add(halo);
    });

    // Horizontal lens streak with radial fade
    const streakCanvas = document.createElement("canvas");
    streakCanvas.width = 512;
    streakCanvas.height = 32;
    const streakCtx = streakCanvas.getContext("2d")!;
    const streakGrad = streakCtx.createLinearGradient(0, 16, 512, 16);
    streakGrad.addColorStop(0, "rgba(255,240,200,0)");
    streakGrad.addColorStop(0.3, "rgba(255,240,200,0.1)");
    streakGrad.addColorStop(0.5, "rgba(255,255,255,0.4)");
    streakGrad.addColorStop(0.7, "rgba(255,240,200,0.1)");
    streakGrad.addColorStop(1, "rgba(255,240,200,0)");
    streakCtx.fillStyle = streakGrad;
    // Vertical fade too
    for (let y = 0; y < 32; y++) {
      const yFade = 1 - Math.abs(y - 16) / 16;
      streakCtx.globalAlpha = yFade * yFade;
      streakCtx.fillRect(0, y, 512, 1);
    }
    const streakTex = new THREE.CanvasTexture(streakCanvas);
    const streakMat = new THREE.SpriteMaterial({
      map: streakTex,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const streak = new THREE.Sprite(streakMat);
    streak.scale.set(100, 4, 1);
    starGlow.add(streak);

    starGlow.position.set(-500, 250, -1800);
    scene.add(starGlow);

    // =============================================
    // TWINKLING STARS — size pulsation buffer
    // =============================================
    const nearStarSizes = new Float32Array(2000);
    for (let i = 0; i < 2000; i++) {
      nearStarSizes[i] = 1.2 + Math.random() * 0.8; // base sizes
    }
    starsNear.geometry.setAttribute("size", new THREE.BufferAttribute(nearStarSizes.slice(), 1));
    (starsNear.material as THREE.PointsMaterial).sizeAttenuation = true;

    // =============================================
    // ANIMATION LOOP
    // =============================================
    const clock = new THREE.Clock();
    let animationId: number;
    let frameCount = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      frameCount++;

      // Star rotation — different speeds for parallax depth (faster)
      starsDeep.rotation.y += 0.00005;
      starsDeep.rotation.x += 0.00002;
      starsMid.rotation.y += 0.0001;
      starsMid.rotation.x += 0.00003 * Math.sin(elapsed * 0.1);
      starsNear.rotation.y += 0.00015;
      starsBlue.rotation.y -= 0.00007;
      starsOrange.rotation.y += 0.00008;

      // Forward motion — near stars drift toward camera for sense of travel
      // They wrap around when behind camera to loop infinitely
      const nearPositions = starsNear.geometry.attributes.position as THREE.BufferAttribute;
      const midPositions = starsMid.geometry.attributes.position as THREE.BufferAttribute;
      const forwardSpeed = 1.2;
      const forwardSpeedMid = 0.4;

      for (let i = 0; i < nearPositions.count; i++) {
        let z = nearPositions.getZ(i) + forwardSpeed;
        if (z > 2500) z -= 4000; // wrap to far back
        nearPositions.setZ(i, z);
      }
      nearPositions.needsUpdate = true;

      for (let i = 0; i < midPositions.count; i++) {
        let z = midPositions.getZ(i) + forwardSpeedMid;
        if (z > 2500) z -= 4500;
        midPositions.setZ(i, z);
      }
      midPositions.needsUpdate = true;

      // Nebula pulsing & drift — breathing effect
      nebulaGroup.rotation.y += 0.00005;
      nebulaGroup.rotation.x += 0.00002;
      nebulaGroup.children.forEach((nebula, i) => {
        const pulse = 1 + 0.03 * Math.sin(elapsed * (0.2 + i * 0.08) + i * 1.5);
        nebula.scale.set(pulse, pulse, 1);
        // Gentle opacity fluctuation
        const mat = (nebula as THREE.Sprite).material;
        if (mat) {
          mat.opacity = mat.opacity * (0.97 + 0.03 * Math.sin(elapsed * 0.3 + i));
        }
      });

      // Star twinkling — pulsate near stars sizes
      if (frameCount % 3 === 0) { // every 3 frames for perf
        const sizes = starsNear.geometry.attributes.size as THREE.BufferAttribute;
        for (let i = 0; i < sizes.count; i++) {
          const base = nearStarSizes[i];
          const twinkle = base * (0.6 + 0.4 * Math.sin(elapsed * (2 + i * 0.01) + i * 0.5));
          sizes.setX(i, twinkle);
        }
        sizes.needsUpdate = true;
      }

      // Distant star — lens flare pulse
      const flarePulse = 0.85 + 0.15 * Math.sin(elapsed * 0.8);
      // Core pulsates scale
      starCore.scale.set(
        12 * (0.95 + 0.05 * Math.sin(elapsed * 1.2)),
        12 * (0.95 + 0.05 * Math.sin(elapsed * 1.2)),
        1
      );
      // Halos pulse opacity (children 1-3 are halos, 4 is streak)
      for (let i = 1; i <= 3; i++) {
        const s = starGlow.children[i] as THREE.Sprite;
        if (s && s.material) {
          s.material.opacity = haloOpacities[i - 1] * flarePulse;
        }
      }
      // Streak subtle rotation
      streak.material.rotation = 0.015 * Math.sin(elapsed * 0.3);

      // Galaxies rotation — faster, more alive
      galaxyMain.rotation.y += 0.0003;
      galaxySecondary.rotation.y -= 0.0004;
      galaxyTiny.rotation.y += 0.0005;

      // Planets — orbital bob motion
      planet1.rotation.y += 0.002;
      ring1.rotation.z += 0.0005;
      planet1Group.position.y += Math.sin(elapsed * 0.2) * 0.05;
      planet2.rotation.y += 0.0025;
      planet2.position.y = 120 + 8 * Math.sin(elapsed * 0.15);
      planet3.rotation.y += 0.003;
      planet3.position.x = 500 + 15 * Math.sin(elapsed * 0.1);

      // Asteroid belt — faster
      asteroidBelt.rotation.y += 0.001;
      asteroidBelt.children.forEach((a) => {
        a.rotation.x += a.userData.rotSpeed.x;
        a.rotation.y += a.userData.rotSpeed.y;
      });

      // Comets with trails (orbital)
      comets.forEach((comet) => {
        comet.angle += comet.speed;
        const cx = comet.radius * Math.cos(comet.angle);
        const cy = comet.yBase + comet.yWave * Math.sin(elapsed * 0.5 + comet.angle);
        const cz = comet.radius * Math.sin(comet.angle) * 0.6;
        comet.mesh.position.set(cx, cy, cz);

        // Update trail
        const tp = comet.trailPositions;
        for (let i = tp.length / 3 - 1; i > 0; i--) {
          tp[i * 3] = tp[(i - 1) * 3];
          tp[i * 3 + 1] = tp[(i - 1) * 3 + 1];
          tp[i * 3 + 2] = tp[(i - 1) * 3 + 2];
        }
        tp[0] = cx;
        tp[1] = cy;
        tp[2] = cz;
        (comet.trail.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      });

      // Shooting stars — fast linear streaks
      shootingStars.forEach((star) => {
        if (!star.active) {
          // Random respawn
          if (Math.random() < 0.005) resetShootingStar(star);
          star.mesh.visible = false;
          star.trail.visible = false;
          return;
        }

        star.life++;
        if (star.life > star.maxLife) {
          star.active = false;
          star.mesh.visible = false;
          star.trail.visible = false;
          return;
        }

        star.mesh.visible = true;
        star.trail.visible = true;

        // Move fast
        star.position.add(star.velocity);
        star.mesh.position.copy(star.position);

        // Fade based on life
        const lifeFrac = star.life / star.maxLife;
        const alpha = lifeFrac < 0.1 ? lifeFrac * 10 : lifeFrac > 0.7 ? (1 - lifeFrac) / 0.3 : 1;
        (star.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
        (star.trail.material as THREE.LineBasicMaterial).opacity = alpha * 0.5;

        // Update trail
        const tp = star.trailPositions;
        for (let i = tp.length / 3 - 1; i > 0; i--) {
          tp[i * 3] = tp[(i - 1) * 3];
          tp[i * 3 + 1] = tp[(i - 1) * 3 + 1];
          tp[i * 3 + 2] = tp[(i - 1) * 3 + 2];
        }
        tp[0] = star.position.x;
        tp[1] = star.position.y;
        tp[2] = star.position.z;
        (star.trail.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      });



      // Cosmic dust — forward drift + turbulence (speed lines feeling)
      cosmicDust.rotation.y += 0.0001;
      cosmicDust.rotation.x += 0.00005;
      cosmicDust.position.x = 5 * Math.sin(elapsed * 0.08);
      const dustPos = cosmicDust.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dustPos.count; i++) {
        let z = dustPos.getZ(i) + 0.8;
        if (z > 1000) z -= 2000;
        dustPos.setZ(i, z);
      }
      dustPos.needsUpdate = true;
      cosmicDust.position.y = 3 * Math.cos(elapsed * 0.06);

      // Camera — subtle ship-like drift and sway + joystick steer
      const zoomVal = zoomRef.current;
      const steer = steerRef.current;
      camera.position.z = 500 - zoomVal * 300;
      // Gentle ambient drift only (no steer on position — universe objects stay fixed)
      camera.position.x = 8 * Math.sin(elapsed * 0.12) + 4 * Math.sin(elapsed * 0.28) + 2 * Math.cos(elapsed * 0.07);
      camera.position.y = 80 + 5 * Math.cos(elapsed * 0.09) + 3 * Math.sin(elapsed * 0.18);
      // Look direction — steer tilts where the ship "points" without moving position
      camera.lookAt(
        3 * Math.sin(elapsed * 0.06) + 1.5 * Math.cos(elapsed * 0.14) + steer.x * 80,
        2 * Math.cos(elapsed * 0.08) + 1 * Math.sin(elapsed * 0.2) + steer.y * -50,
        0
      );
      // Roll — ship tilts into turns like a fighter jet
      camera.rotation.z = 0.008 * Math.sin(elapsed * 0.15) + 0.004 * Math.cos(elapsed * 0.25) - steer.x * 0.06;

      // =============================================
      // LASER BEAMS — animate active lasers
      // =============================================
      // Ship sway offset — lasers inherit the ship's drift + joystick steering
      const steerNow = steerRef.current;
      const shipSwayX = 0.15 * Math.cos(elapsed * 0.12) + 0.08 * Math.cos(elapsed * 0.28) + steerNow.x * 0.6;
      const shipSwayY = 0.08 * Math.sin(elapsed * 0.09) + 0.04 * Math.cos(elapsed * 0.18) + steerNow.y * 0.4;

      const lasers = lasersRef.current;
      for (let i = lasers.length - 1; i >= 0; i--) {
        const laser = lasers[i];
        laser.life++;

        if (laser.life > laser.maxLife) {
          // Remove from scene
          scene.remove(laser.mesh);
          scene.remove(laser.glow);
          laser.mesh.geometry.dispose();
          (laser.mesh.material as THREE.Material).dispose();
          laser.glow.geometry.dispose();
          (laser.glow.material as THREE.Material).dispose();
          lasers.splice(i, 1);
          continue;
        }

        // Move + add ship sway so lasers wave with the ship motion
        laser.velocity.x += shipSwayX;
        laser.velocity.y += shipSwayY;
        laser.position.add(laser.velocity);
        // Remove sway from velocity so it doesn't accumulate
        laser.velocity.x -= shipSwayX;
        laser.velocity.y -= shipSwayY;

        laser.mesh.position.copy(laser.position);
        laser.glow.position.copy(laser.position);

        // Orient in direction of travel
        laser.mesh.lookAt(
          laser.position.x + laser.velocity.x,
          laser.position.y + laser.velocity.y,
          laser.position.z + laser.velocity.z
        );
        laser.glow.lookAt(
          laser.position.x + laser.velocity.x,
          laser.position.y + laser.velocity.y,
          laser.position.z + laser.velocity.z
        );

        // Fade out in last 30% of life
        const lifeFrac = laser.life / laser.maxLife;
        if (lifeFrac > 0.7) {
          const fadeAlpha = 1 - (lifeFrac - 0.7) / 0.3;
          (laser.mesh.material as THREE.MeshBasicMaterial).opacity = fadeAlpha;
          (laser.glow.material as THREE.MeshBasicMaterial).opacity = fadeAlpha * 0.3;
        }

        // Scale down slightly as it gets far
        const scale = 1 - lifeFrac * 0.3;
        laser.mesh.scale.set(scale, scale, 1 + lifeFrac * 2);
        laser.glow.scale.set(scale, scale, 1 + lifeFrac * 2);
      }

      composer.render();
    };
    animate();

    // === RESIZE ===
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
    <>
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
      {/* Cinematic vignette */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </>
  );
});

UniverseScene.displayName = "UniverseScene";

export default UniverseScene;
