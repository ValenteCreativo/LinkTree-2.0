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
} from "react-icons/fa";

type Link = {
  title: string;
  url: string;
  description?: string;
};

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
  personal: [
    { title: "GitHub", url: "https://github.com/ValenteCreativo", description: "Código open source" },
    { title: "Textos Técnicos (Blog)", url: "https://medium.com/@geovalente", description: "Artículos en Medium" },
    { title: "Programación Creativa", url: "https://codepen.io/ValenteCreativo", description: "Experimentos interactivos" },
    { title: "Textos / Proyectos", url: "https://valentinmartinezmx.wixsite.com/ideas", description: "Ideas y ensayos" },
    { title: "Arte / Experimentos / Jams", url: "https://www.instagram.com/valecreativo/", description: "Proceso creativo" },
    { title: "TA'AK Studio", url: "https://taak-studio.bubbleapps.io/version-test", description: "Studio de diseño" },
    { title: "Devpost", url: "https://devpost.com/ValenteCreativo", description: "Hackathon projects" },
    { title: "Taikai", url: "https://taikai.network/valentecreativo", description: "Web3 hackathons" },
    { title: "Devfolio", url: "https://devfolio.co/@ValenteCreativo/projects", description: "Developer portfolio" },
    { title: "Dorahacks", url: "https://dorahacks.io/hacker/ValenteCreativo", description: "BUIDL projects" },
    { title: "NASA SpaceApps", url: "https://www.spaceappschallenge.org/nasa-space-apps-2024/find-a-team/climatewizards/?tab=project", description: "Space challenge" },
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

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = 500;
      const progress = Math.min(window.scrollY / maxScroll, 1);
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderLinks = (links: Link[]) => (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {links.map((link, index) => (
        <motion.a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="link-card group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-sm">{link.title}</p>
              {link.description && (
                <p className="text-gray-500 text-xs mt-0.5">{link.description}</p>
              )}
            </div>
            <span className="text-gray-600 group-hover:text-green-400 transition-colors text-lg">
              →
            </span>
          </div>
        </motion.a>
      ))}
    </motion.div>
  );

  return (
    <main className="relative min-h-screen font-[var(--font-geist-sans)]">
      {/* 3D Universe Background */}
      <PortalScene zoom={scrollProgress} />

      {/* Background Image Layer */}
      <div
        className="fixed top-0 left-0 w-full h-full z-[5] transition-all duration-200 pointer-events-none"
        style={{
          transform: `scale(${1 + scrollProgress * 0.5})`,
          opacity: 1 - scrollProgress,
        }}
      >
        <img
          src="/BG-linktree (1).png"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Spacer for scroll effect */}
        <section className="h-screen" />

        {/* Profile Section */}
        <section className="min-h-screen flex items-start justify-center pt-16 pb-20 px-4">
          <div className="w-full max-w-xl">
            {/* Profile Card */}
            <motion.div
              className="bg-black/70 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Avatar & Name */}
              <div className="flex flex-col items-center space-y-4 mb-6">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 opacity-60 blur-sm" />
                  <img
                    loading="lazy"
                    className="relative rounded-full w-28 h-28 object-cover border-2 border-white/20"
                    src={profile.avatar}
                    alt={profile.title}
                  />
                </div>
                <h1 className="text-2xl font-bold text-white">{profile.title}</h1>
                <p className="banner-text">{profile.banner}</p>
              </div>

              {/* Tabs */}
              <div className="flex justify-center gap-3 mb-6">
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderLinks(profile.personal)}
                  </motion.div>
                )}
                {tab === "portfolio" && (
                  <motion.div
                    key="portfolio"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PortfolioSection />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Social Icons */}
              <div className="flex justify-center gap-5 mt-8 pt-6 border-t border-white/10">
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
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}
