"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PortalScene, { UniverseSceneHandle } from "./components/portalscene";
import PortfolioSection from "./components/PortfolioSection";
import {
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaEnvelope,
  FaRocket,
  FaYoutube,
  FaSpotify,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";

type SocialKey = keyof typeof iconMap;

const iconMap = {
  instagram: <FaInstagram />,
  twitter: <FaTwitter />,
  linkedin: <FaLinkedin />,
  warpcast: <FaRocket />,
  mail: <FaEnvelope />,
  youtube: <FaYoutube />,
  spotify: <FaSpotify />,
};

const profile = {
  avatar: "/foto-vale2026.png",
  title: "Valentín Martínez",
  banner: "Technology Developer for Social & Environmental Impact",
  links: [
    { title: "TA'AK Studio", url: "https://taak-studio.bubbleapps.io/version-test" },
    { title: "GitHub", url: "https://github.com/ValenteCreativo" },
    { title: "Programación Creativa", url: "https://codepen.io/ValenteCreativo" },
    { title: "Blog Literario", url: "https://valentinmartinezmx.wixsite.com/ideas/blog" },
    { title: "Blog Técnico", url: "https://medium.com/@geovalente" },
  ],
  hackathons: [
    { title: "Devpost", url: "https://devpost.com/ValenteCreativo" },
    { title: "Taikai", url: "https://taikai.network/valentecreativo" },
    { title: "Devfolio", url: "https://devfolio.co/@ValenteCreativo/projects" },
    { title: "Dorahacks", url: "https://dorahacks.io/hacker/ValenteCreativo" },
    { title: "NASA SpaceApps", url: "https://www.spaceappschallenge.org/nasa-space-apps-2024/find-a-team/climatewizards/?tab=project" },
    { title: "EthGlobal HackMoney", url: "https://ethglobal.com/showcase/orien-c6wsvy" },
    { title: "EthGlobal Buenos Aires", url: "http://ethglobal.com/showcase/sigilo-b526k" },
  ],
  socials: [
    { title: "instagram", url: "https://www.instagram.com/ValePantera4" },
    { title: "twitter", url: "https://twitter.com/ValeCreativo" },
    { title: "linkedin", url: "https://www.linkedin.com/in/valentinmartinezmx/" },
    { title: "warpcast", url: "https://warpcast.com/valentecreativo" },
    { title: "mail", url: "mailto:geovalente@proton.me" },
    { title: "youtube", url: "https://www.youtube.com/@ValeCreativo" },
    { title: "spotify", url: "https://open.spotify.com/user/12132946369?si=1119b54e9a6e4939" },
  ],
};

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [tab, setTab] = useState<"personal" | "portfolio">("personal");
  const [hackathonsOpen, setHackathonsOpen] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const sceneRef = useRef<UniverseSceneHandle>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = 500;
      const progress = Math.min(window.scrollY / maxScroll, 1);
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFire = () => {
    if (sceneRef.current) {
      sceneRef.current.fire();
      setIsFiring(true);
      setTimeout(() => setIsFiring(false), 150);
    }
  };

  // Joystick logic
  const JOYSTICK_RADIUS = 22; // max movement in px
  const joystickTouchId = useRef<number | null>(null);

  const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current || !isDragging.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    // Clamp to radius
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOYSTICK_RADIUS) {
      dx = (dx / dist) * JOYSTICK_RADIUS;
      dy = (dy / dist) * JOYSTICK_RADIUS;
    }

    // Normalize to -1..1
    const nx = dx / JOYSTICK_RADIUS;
    const ny = dy / JOYSTICK_RADIUS;

    setJoystickPos({ x: dx, y: dy });
    if (sceneRef.current) {
      sceneRef.current.steer(nx, ny);
    }
  }, []);

  const handleJoystickEnd = useCallback(() => {
    isDragging.current = false;
    joystickTouchId.current = null;
    // Don't snap to center — let the animation loop ease it back
  }, []);

  // Smooth return to center when not dragging
  useEffect(() => {
    let animId: number;
    const ease = () => {
      if (!isDragging.current) {
        setJoystickPos((prev) => {
          const nx = prev.x * 0.97;
          const ny = prev.y * 0.97;
          // Stop when close enough
          if (Math.abs(nx) < 0.3 && Math.abs(ny) < 0.3) {
            if (sceneRef.current) sceneRef.current.steer(0, 0);
            return { x: 0, y: 0 };
          }
          if (sceneRef.current) {
            sceneRef.current.steer(nx / JOYSTICK_RADIUS, ny / JOYSTICK_RADIUS);
          }
          return { x: nx, y: ny };
        });
      }
      animId = requestAnimationFrame(ease);
    };
    animId = requestAnimationFrame(ease);
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleJoystickMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      // Find the touch that started on the joystick
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joystickTouchId.current) {
          e.preventDefault(); // prevent scroll
          handleJoystickMove(e.touches[i].clientX, e.touches[i].clientY);
          break;
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      // Only end if our tracked touch was released
      let found = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joystickTouchId.current) {
          found = true;
          break;
        }
      }
      if (!found && isDragging.current) {
        handleJoystickEnd();
      }
    };
    const onMouseUp = () => handleJoystickEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleJoystickMove, handleJoystickEnd]);

  return (
    <main className="relative font-[var(--font-geist-sans)]">
      {/* 3D Universe Background */}
      <PortalScene ref={sceneRef} zoom={scrollProgress} />

      {/* Background Image Layer — subtle zoom + fade */}
      <div
        className="fixed top-0 left-0 w-full h-full z-[5] pointer-events-none transition-opacity duration-700 ease-out"
        style={{
          opacity: Math.max(0, 1 - scrollProgress * 1.8),
        }}
      >
        <div
          className="w-full h-full transition-transform duration-700 ease-out"
          style={{
            transform: `scale(${1 + scrollProgress * 0.15})`,
          }}
        >
          <img
            src="/BG-linktree (1).png"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* FIRE BUTTON — cockpit panel style */}
      <div
        className="fixed bottom-[12%] md:bottom-[9%] z-[9999] pointer-events-auto right-[8%] md:right-[calc(50%-200px)]"
        style={{
          opacity: Math.max(0, 1 - scrollProgress * 3),
        }}
      >
        <button
          onClick={handleFire}
          onTouchEnd={(e) => { e.preventDefault(); handleFire(); }}
          className={`
            relative group
            w-10 h-10 md:w-10 md:h-10 rounded-full
            bg-[#0a1a1a]/80
            border border-[#1a3a3a]/80
            shadow-[0_0_4px_rgba(0,180,180,0.15),inset_0_0_3px_rgba(0,100,100,0.2)]
            flex items-center justify-center
            cursor-pointer
            hover:shadow-[0_0_8px_rgba(0,200,200,0.3),inset_0_0_4px_rgba(0,150,150,0.3)]
            hover:border-[#2a5a5a]/80
            active:scale-90 active:shadow-[0_0_12px_rgba(0,255,200,0.5)]
            transition-all duration-100
            ${isFiring ? "scale-90 shadow-[0_0_14px_rgba(0,255,200,0.6)] border-[#3a7a7a]" : ""}
          `}
          style={{ touchAction: "none" }}
          aria-label="Fire lasers"
        >
          <div className="absolute inset-[3px] rounded-full border border-[#0f4040]/60" />
          <svg
            className="relative text-[#40b0a0]/70 group-hover:text-[#60e0d0] transition-colors w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* JOYSTICK — cockpit panel style */}
      <div
        className="fixed bottom-[12%] md:bottom-[9%] z-[9999] pointer-events-auto left-[8%] md:left-[calc(50%-200px)]"
        style={{
          opacity: Math.max(0, 1 - scrollProgress * 3),
        }}
      >
        <div
          ref={joystickRef}
          onMouseDown={() => { isDragging.current = true; }}
          onTouchStart={(e) => {
            e.preventDefault();
            isDragging.current = true;
            if (e.touches.length > 0) {
              joystickTouchId.current = e.touches[0].identifier;
            }
          }}
          className="relative w-12 h-12 md:w-11 md:h-11 rounded-full bg-[#0a1a1a]/80 border border-[#1a3a3a]/80 shadow-[0_0_4px_rgba(0,180,180,0.1),inset_0_0_6px_rgba(0,60,60,0.3)] cursor-grab active:cursor-grabbing flex items-center justify-center"
          style={{ touchAction: "none" }}
        >
          {/* Crosshair lines — teal glow */}
          <div className="absolute w-[1px] h-5 bg-[#2a6060]/40" />
          <div className="absolute w-5 h-[1px] bg-[#2a6060]/40" />

          {/* Joystick knob */}
          <div
            className="absolute w-5 h-5 md:w-4 md:h-4 rounded-full bg-[#0d2828] border border-[#2a5a5a]/70 shadow-[0_0_4px_rgba(0,150,130,0.2)] transition-transform duration-75"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            }}
          >
            <div className="absolute inset-[2px] rounded-full bg-[#1a4040]/80" />
          </div>
        </div>
      </div>

      {/* Scroll indicator arrow */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none" style={{ opacity: 1 - scrollProgress * 3 }}>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-white/60 text-xs tracking-widest uppercase">Scroll</span>
          <FaChevronDown className="text-white/60 text-lg" />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <section className="h-[40vh] md:h-screen" />

        {/* Profile Section */}
        <section className="flex items-start justify-center pt-12 pb-8 px-4">
          <div className="w-full max-w-md">
            <motion.div
              className="bg-black/60 backdrop-blur-sm rounded-2xl p-8 border border-white/5 shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Avatar & Name */}
              <div className="flex flex-col items-center space-y-3 mb-6">
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-green-500 to-blue-500 opacity-50 blur-[2px]" />
                  <img
                    loading="lazy"
                    className="relative rounded-full w-32 h-32 object-cover object-center scale-125"
                    src={profile.avatar}
                    alt={profile.title}
                  />
                </div>
                <h1 className="text-xl font-bold text-white">{profile.title}</h1>
                <p className="banner-text text-xs">{profile.banner}</p>
              </div>

              {/* Social Icons — top, compact */}
              <div className="flex justify-center gap-4 mb-6">
                {profile.socials.map((social, index) => {
                  const key = social.title.toLowerCase() as SocialKey;
                  const icon = iconMap[key];
                  return icon ? (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon"
                      title={social.title}
                    >
                      {icon}
                    </a>
                  ) : null;
                })}
              </div>

              {/* Tabs */}
              <div className="flex justify-center gap-2 mb-5">
                {(["personal", "portfolio"] as const).map((t) => (
                  <button
                    key={t}
                    className={`tab-pill ${tab === t ? "tab-pill-active" : "tab-pill-inactive"}`}
                    onClick={() => setTab(t)}
                  >
                    {t === "personal" ? "Personal" : "Portafolio"}
                  </button>
                ))}
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                {tab === "personal" && (
                  <motion.div
                    key="personal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    {/* Main links — clean list */}
                    {profile.links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-card flex items-center justify-between group"
                      >
                        <span className="text-white text-sm font-medium">{link.title}</span>
                        <FaChevronRight className="text-gray-600 group-hover:text-green-400 text-xs transition-colors" />
                      </a>
                    ))}

                    {/* Hackathons — collapsible */}
                    <div className="mt-3">
                      <button
                        onClick={() => setHackathonsOpen(!hackathonsOpen)}
                        className="w-full link-card flex items-center justify-between"
                      >
                        <span className="text-white text-sm font-medium">🏆 Hackathones</span>
                        <motion.span
                          animate={{ rotate: hackathonsOpen ? 90 : 0 }}
                          className="text-gray-500 text-xs"
                        >
                          <FaChevronRight />
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {hackathonsOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 pt-1 space-y-1">
                              {profile.hackathons.map((hack, i) => (
                                <a
                                  key={i}
                                  href={hack.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block py-2 px-3 text-gray-400 text-xs hover:text-white transition-colors rounded-lg hover:bg-white/5"
                                >
                                  {hack.title}
                                </a>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {tab === "portfolio" && (
                  <motion.div
                    key="portfolio"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PortfolioSection />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}
