"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PortalScene from "./components/portalscene";
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
    { title: "GitHub", url: "https://github.com/ValenteCreativo" },
    { title: "Blog Técnico", url: "https://medium.com/@geovalente" },
    { title: "Programación Creativa", url: "https://codepen.io/ValenteCreativo" },
    { title: "TA'AK Studio", url: "https://taak-studio.bubbleapps.io/version-test" },
  ],
  hackathons: [
    { title: "Devpost", url: "https://devpost.com/ValenteCreativo" },
    { title: "Taikai", url: "https://taikai.network/valentecreativo" },
    { title: "Devfolio", url: "https://devfolio.co/@ValenteCreativo/projects" },
    { title: "Dorahacks", url: "https://dorahacks.io/hacker/ValenteCreativo" },
    { title: "NASA SpaceApps", url: "https://www.spaceappschallenge.org/nasa-space-apps-2024/find-a-team/climatewizards/?tab=project" },
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

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = 500;
      const progress = Math.min(window.scrollY / maxScroll, 1);
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="relative min-h-screen font-[var(--font-geist-sans)]">
      {/* 3D Universe Background */}
      <PortalScene zoom={scrollProgress} />

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
        <section className="h-screen" />

        {/* Profile Section */}
        <section className="min-h-screen flex items-start justify-center pt-12 pb-20 px-4">
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
