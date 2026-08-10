"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";

export interface WormholeSceneHandle {
  dispose: () => void;
}

// ─── Helpers ───────────────────────────────────────────────
const Lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function hexToVec3(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255
  );
}

// ─── Noise GLSL ────────────────────────────────────────────
const SNOISE = /* glsl */ `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

// ─── FinalPass shader ──────────────────────────────────────
const FinalPass = {
  uniforms: {
    iTime: { value: 0 },
    tDiffuse: { value: null as THREE.Texture | null },
    torusTexture: { value: null as THREE.Texture | null },
    bloomTexture: { value: null as THREE.Texture | null },
    haloTexture: { value: null as THREE.Texture | null },
    uBg: { value: hexToVec3("#000000") },
    uFlameA: { value: hexToVec3("#2bf0ff") },
    uFlameB: { value: hexToVec3("#7a3cff") },
    uFlameAmt: { value: 0.2 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform float iTime;
    uniform sampler2D tDiffuse;
    uniform sampler2D bloomTexture;
    uniform sampler2D torusTexture;
    uniform sampler2D haloTexture;
    uniform vec3 uBg;
    uniform vec3 uFlameA;
    uniform vec3 uFlameB;
    uniform float uFlameAmt;
    varying vec2 vUv;
    vec3 warp3d(vec3 pos, float t){
      float curv=.8, a=1.9, b=0.7;
      pos *= 2.;
      pos.x += curv*sin(t+a*pos.y)+t*b;
      pos.y += curv*cos(t+a*pos.x);
      pos.y += curv*sin(t+a*pos.z)+t*b;
      pos.z += curv*cos(t+a*pos.y);
      pos.z += curv*sin(t+a*pos.x)+t*b;
      pos.x += curv*cos(t+a*pos.z);
      return 0.5+0.5*cos(pos.xyz+vec3(1,2,4));
    }
    void main(){
      vec2 uv = 2.*vUv - 1.;
      vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime*1.5), vec3(1.5));
      vec3 flame = 1.5*uFlameA*w.x;
      flame *= w.y;
      flame += uFlameB*w.z;
      flame *= smoothstep(0.25, 1., abs(uv.y));
      float md = smoothstep(-0.7, 1., -uv.y*uv.x);
      flame *= md*md;
      vec3 bg = uBg * (1.0 - 0.4 * length(uv));
      vec3 halo = texture2D(haloTexture, vUv).xyz;
      gl_FragColor = vec4(
        bg + flame*uFlameAmt
        + texture2D(bloomTexture, vUv).xyz
        + texture2D(torusTexture, vUv).xyz
        + texture2D(tDiffuse, vUv).xyz
        + halo,
        1.0
      );
    }
  `,
};

// ─── Tunnel vertex shader ──────────────────────────────────
const tunnelVertexShader = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uSwirl;
uniform float uScale;
uniform vec3 uColLow;
uniform vec3 uColHigh;
uniform vec3 uCursor;
uniform float uRepelRadius;
uniform float uRepelStrength;
uniform float uActivity;
varying float vFade;
varying vec3 vColor;
${SNOISE}
void main() {
  vec3 wp = vec3(position.x * 7.0, 0.0, position.z * 25.0);
  wp.x += position.y * 6.0;
  float wn = snoise(vec3(wp.x * 0.08, wp.z * 0.08, uTime * 0.15)) * 2.0;
  wn += snoise(vec3(wp.x * 0.16, wp.z * 0.16, uTime * 0.3)) * 0.8;

  float tunnelR = 12.0;
  float currentSliceRadius = sqrt(max(0.0, 17.64 - position.z * position.z));
  float maxSliceWidth = 9.2195 * currentSliceRadius;
  float normalizedX = wp.x / (maxSliceWidth + 0.001);
  float tunnelAngle = normalizedX * 3.14159265;

  float jitterAngle = snoise(vec3(position.x * 15.0, position.y * 15.0, uTime * 0.1)) * 0.35;
  float jitterZ = snoise(vec3(position.y * 15.0, position.z * 15.0, uTime * 0.1)) * 4.0;
  float ambientSwirl = snoise(vec3(position.x * 5.0, position.y * 5.0, uTime * 0.2)) * 3.0;
  tunnelAngle += jitterAngle + ambientSwirl * uSwirl;

  float dynamicR = tunnelR - wn;
  vec3 tunnelPos = vec3(dynamicR * sin(tunnelAngle), -dynamicR * cos(tunnelAngle), wp.z + jitterZ);

  vec3 finalPos = tunnelPos * uScale;
  vec4 modelPosition = modelMatrix * vec4(finalPos, 1.0);
  vec3 toP = modelPosition.xyz - uCursor;
  float cd = length(toP);
  float fall = smoothstep(uRepelRadius, 0.0, cd);
  modelPosition.xyz += normalize(toP + vec3(0.0001)) * fall * uRepelStrength * uActivity;
  vec4 mvPosition = viewMatrix * modelPosition;

  float colMix = smoothstep(-3.0, 3.0, position.y + position.x * 0.5);
  vColor = mix(uColLow, uColHigh, clamp(colMix, 0.0, 1.0));
  vFade = 1.0;

  gl_PointSize = uSize * (10.0 / -mvPosition.z);
  gl_PointSize = max(gl_PointSize, 1.5);
  gl_Position = projectionMatrix * mvPosition;
}
`;

// ─── Tunnel fragment shader ────────────────────────────────
const tunnelFragmentShader = /* glsl */ `
uniform float uOpacity;
uniform float uBrightness;
uniform float uAppear;
varying float vFade;
varying vec3 vColor;
void main() {
  vec2 xy = gl_PointCoord - 0.5;
  float ll = length(xy);
  if (ll > 0.5) discard;
  float a = smoothstep(0.5, 0.1, ll);
  gl_FragColor = vec4(vColor * uBrightness, vFade * a * uOpacity * uAppear);
}
`;

// ─── Atmosphere vertex shader ──────────────────────────────
const atmoVertexShader = /* glsl */ `
attribute float size;
attribute float seed;
uniform float uTime;
uniform vec2 uRes;
varying float vA;
vec3 warp(vec3 p, float t){
  float c=0.9, a=1.9, b=0.02, s=0.05;
  p *= 2.;
  p.x += c*sin(s*t+a*p.y)+t*b;
  p.y += c*cos(s*t+a*p.x);
  p.y += c*sin(s*t+a*p.z)+t*b;
  p.z += c*cos(s*t+a*p.y);
  p.z += c*sin(s*t+a*p.x)+t*b;
  p.x += c*cos(s*t+a*p.z);
  return cos(p+vec3(1,2,4));
}
void main(){
  vec3 v = position*4.0 + warp(position, uTime)*1.2;
  vec4 mv = modelViewMatrix * vec4(v, 1.0);
  float r = length(v);
  float farF = 1.0 - smoothstep(5.0, 6.5, r);
  float nearF = smoothstep(0.0, 0.5, -mv.z);
  vA = farF * nearF;
  gl_PointSize = size * uRes.y / 900.0 / -mv.z;
  gl_PointSize = max(gl_PointSize, 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

// ─── Atmosphere fragment shader ────────────────────────────
const atmoFragmentShader = /* glsl */ `
uniform vec3 uColor;
varying float vA;
void main(){
  vec2 p = gl_PointCoord - 0.5;
  float l = length(p);
  if (l > 0.5) discard;
  float tex = smoothstep(0.5, 0.0, l);
  gl_FragColor = vec4(uColor * tex, tex * vA * 0.6);
}
`;

// ─── Layers ────────────────────────────────────────────────
const LAYERS = { NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3 };

// ─── Component ─────────────────────────────────────────────
const WormholeScene = forwardRef<WormholeSceneHandle, object>((_props, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const disposedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    dispose: () => {
      disposedRef.current = true;
    },
  }));

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;
    disposedRef.current = false;

    // ─── Renderer ──────────────────────────────────────────
    const canvas = document.createElement("canvas");
    currentMount.appendChild(canvas);
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    // ─── Scene ─────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 0, 15);

    // ─── Camera ────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      400
    );
    camera.position.set(0, 0, 20);
    camera.layers.enable(LAYERS.TORUS_SCENE);
    camera.layers.enable(LAYERS.BLOOM_SCENE);
    camera.layers.enable(LAYERS.ENTIRE_SCENE);
    scene.add(camera);

    // ─── Tunnel Points ─────────────────────────────────────
    const tunnelGeo = new THREE.SphereGeometry(4.2, 200, 600);
    const tunnelUniforms = {
      uTime: { value: 0 },
      uAppear: { value: 0 },
      uColLow: { value: hexToVec3("#180a3a") },
      uColHigh: { value: hexToVec3("#2bf0ff") },
      uOpacity: { value: 1.44 },
      uSize: { value: 5 },
      uBrightness: { value: 0.4 },
      uSwirl: { value: 0.39 },
      uScale: { value: 0.17 },
      uCursor: { value: new THREE.Vector3() },
      uRepelRadius: { value: 2.4 },
      uRepelStrength: { value: 0.8 },
      uActivity: { value: 0 },
    };

    const tunnelMat = new THREE.ShaderMaterial({
      uniforms: tunnelUniforms,
      vertexShader: tunnelVertexShader,
      fragmentShader: tunnelFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const tunnelPoints = new THREE.Points(tunnelGeo, tunnelMat);
    tunnelPoints.frustumCulled = false;
    tunnelPoints.layers.enable(LAYERS.ENTIRE_SCENE);

    const tunnelGroup = new THREE.Group();
    tunnelGroup.add(tunnelPoints);
    scene.add(tunnelGroup);

    // ─── Atmosphere Motes — denser for speed feeling ───────
    const atmoCount = 500;
    const atmoPositions = new Float32Array(atmoCount * 3);
    const atmoSizes = new Float32Array(atmoCount);
    const atmoSeeds = new Float32Array(atmoCount);
    for (let i = 0; i < atmoCount; i++) {
      atmoPositions[i * 3] = 2 * Math.random() - 1;
      atmoPositions[i * 3 + 1] = 2 * Math.random() - 1;
      atmoPositions[i * 3 + 2] = 2 * Math.random() - 1;
      atmoSizes[i] = 24 * (0.4 + Math.random());
      atmoSeeds[i] = Math.random();
    }
    const atmoGeo = new THREE.BufferGeometry();
    atmoGeo.setAttribute("position", new THREE.Float32BufferAttribute(atmoPositions, 3));
    atmoGeo.setAttribute("size", new THREE.Float32BufferAttribute(atmoSizes, 1));
    atmoGeo.setAttribute("seed", new THREE.Float32BufferAttribute(atmoSeeds, 1));

    const atmoUniforms = {
      uTime: { value: 0 },
      uColor: { value: hexToVec3("#8fe6ff") },
      uRes: { value: new THREE.Vector2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio) },
    };

    const atmoMat = new THREE.ShaderMaterial({
      uniforms: atmoUniforms,
      vertexShader: atmoVertexShader,
      fragmentShader: atmoFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });

    const atmoPoints = new THREE.Points(atmoGeo, atmoMat);
    atmoPoints.frustumCulled = false;
    atmoPoints.layers.enable(LAYERS.ENTIRE_SCENE);
    scene.add(atmoPoints);

    // ─── Postprocessing ────────────────────────────────────
    const renderScene = new RenderPass(scene, camera);

    const torusComposer = new EffectComposer(renderer);
    torusComposer.renderToScreen = false;
    torusComposer.addPass(renderScene);
    torusComposer.addPass(new ShaderPass(GammaCorrectionShader));
    torusComposer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.35, 0.3, 0));
    torusComposer.addPass(new ShaderPass(CopyShader));

    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.5, 0));
    bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));

    const finalPass = new ShaderPass(FinalPass);
    finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
    finalPass.uniforms.torusTexture.value = torusComposer.renderTarget1.texture;

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);

    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(renderScene);
    finalComposer.addPass(finalPass);
    finalComposer.addPass(fxaaPass);

    // ─── Animation state ───────────────────────────────────
    let rollPhase = 0;
    const appearStart = performance.now();
    let t0 = performance.now() / 1000;
    let scrollSmooth = 0;
    let scrollCurrent = 0;
    const mouse = { x: 0, y: 0 };

    // Progressive warp: scroll target ramps from 0 → 1 over 8 seconds
    const warpStartTime = performance.now();
    const WARP_DURATION = 8000; // ms

    // ─── Animate ───────────────────────────────────────────
    let animationId: number;

    const animate = () => {
      if (disposedRef.current) return;
      animationId = requestAnimationFrame(animate);

      const t = performance.now() / 1000;
      const dt = Math.min(0.05, t - t0);
      t0 = t;

      // Progressive warp: accelerates over time (ease-in curve)
      const warpElapsed = performance.now() - warpStartTime;
      const warpProgress = clamp(warpElapsed / WARP_DURATION, 0, 1);
      // Ease-in-out for a sense of acceleration then cruising
      const warpCurve = warpProgress < 0.4
        ? (warpProgress / 0.4) * (warpProgress / 0.4) * 0.7  // accelerate
        : 0.7 + (warpProgress - 0.4) / 0.6 * 0.3;            // cruise at high speed
      const scrollTarget = warpCurve;

      // Scroll simulation — smooth interpolation
      scrollSmooth = Lerp(scrollSmooth, scrollTarget, 0.08);
      scrollCurrent = Lerp(scrollCurrent, scrollSmooth, 0.05);

      // Tunnel uniforms — swirl increases with speed
      tunnelUniforms.uTime.value = t * (1 + warpCurve * 1.5); // time runs faster at high warp
      tunnelUniforms.uSwirl.value = 0.39 * (1 + scrollCurrent * 2.5); // more swirl
      tunnelUniforms.uBrightness.value = 0.4 + warpCurve * 0.25; // brighter at speed
      tunnelUniforms.uSize.value = 5 + warpCurve * 2; // particles grow slightly

      // Appear fade-in
      const elapsed = (performance.now() - appearStart) / 1000;
      tunnelUniforms.uAppear.value = clamp((elapsed - 0.1) / 0.8, 0, 1);

      // Camera flight — deeper penetration, progressive
      const flyDepth = scrollCurrent * 42; // deeper than before
      const shake = warpCurve * 0.3; // subtle high-speed shake
      camera.position.set(
        mouse.x * 0.12 + Math.sin(t * 12) * shake * 0.5,
        mouse.y * 0.12 + Math.cos(t * 15) * shake * 0.3,
        20 - flyDepth
      );
      camera.lookAt(
        mouse.x * 0.6 + Math.sin(t * 8) * shake,
        mouse.y * 0.6 + Math.cos(t * 10) * shake * 0.6,
        camera.position.z - 12 - warpCurve * 8
      );

      // FOV increases with speed for a visceral rush feeling
      camera.fov = 45 + warpCurve * 20;
      camera.updateProjectionMatrix();

      // Roll — spins faster at higher warp
      rollPhase += dt * (0.065 + scrollCurrent * 0.12);
      tunnelGroup.rotation.z = rollPhase;

      // Atmosphere — faster motes at high speed
      atmoUniforms.uTime.value = t * (8.0 + warpCurve * 12.0);
      atmoPoints.position.copy(camera.position);
      finalPass.uniforms.iTime.value = t;

      // Render passes
      camera.layers.set(LAYERS.TORUS_SCENE);
      torusComposer.render();
      camera.layers.set(LAYERS.BLOOM_SCENE);
      bloomComposer.render();
      camera.layers.set(LAYERS.ENTIRE_SCENE);
      finalComposer.render();
    };

    animationId = requestAnimationFrame(animate);

    // ─── Resize ────────────────────────────────────────────
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      torusComposer.setPixelRatio(dpr);
      torusComposer.setSize(w, h);
      bloomComposer.setPixelRatio(dpr);
      bloomComposer.setSize(w, h);
      finalComposer.setPixelRatio(dpr);
      finalComposer.setSize(w, h);
      fxaaPass.uniforms["resolution"].value.set(1 / w, 1 / h);
      atmoUniforms.uRes.value.set(w * dpr, h * dpr);
    };
    window.addEventListener("resize", handleResize);

    // ─── Cleanup ───────────────────────────────────────────
    return () => {
      disposedRef.current = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      if (currentMount.contains(canvas)) {
        currentMount.removeChild(canvas);
      }
      renderer.dispose();
      tunnelGeo.dispose();
      tunnelMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
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
      {/* Cinematic vignette — matches main scene */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      {/* Speed lines overlay effect */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center, rgba(43,240,255,0.03) 0%, transparent 60%)",
        }}
      />
    </>
  );
});

WormholeScene.displayName = "WormholeScene";

export default WormholeScene;
