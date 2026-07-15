"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type PortfolioItem = {
  url: string;
  label: string;
};

type Category = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  items: PortfolioItem[];
};

const categories: Category[] = [
  {
    id: "ambiental",
    label: "Impacto Ambiental",
    emoji: "🌱",
    color: "from-green-500/20 to-green-900/10",
    items: [
      { url: "https://aura-tau-five.vercel.app", label: "Aura" },
      { url: "https://arvi-eight.vercel.app", label: "Arvi" },
      { url: "https://aona.vercel.app", label: "Aona" },
      { url: "https://sen-network1.vercel.app", label: "SEN Network" },
      { url: "https://rembu-app.vercel.app", label: "Rembu" },
    ],
  },
  {
    id: "social",
    label: "Impacto Social",
    emoji: "🤝",
    color: "from-blue-500/20 to-blue-900/10",
    items: [
      { url: "https://care-pilot-nu.vercel.app", label: "CarePilot" },
      { url: "https://seedr-three.vercel.app", label: "Seedr" },
      { url: "https://www.side-b.art", label: "Side-B" },
      { url: "https://sigilo-zeta.vercel.app", label: "Sigilo" },
      { url: "https://supply-cycle.vercel.app", label: "Supply Cycle" },
      { url: "https://bitbitmami.netlify.app", label: "BitBitMami" },
    ],
  },
  {
    id: "cliente",
    label: "Clientes",
    emoji: "💼",
    color: "from-amber-500/20 to-amber-900/10",
    items: [
      { url: "https://martina-store-2.vercel.app", label: "Martina Store" },
      { url: "https://rizoma-shipyard-ynwq.vercel.app", label: "Rizoma" },
      { url: "https://rls-jerusalem-336-ivory.vercel.app/", label: "RLS Jerusalem" },
      { url: "https://patrimo.pro", label: "Patrimo" },
      { url: "https://www.patas4land.xyz", label: "Patas4Land" },
      { url: "https://mindfulverso-zeta.vercel.app/", label: "Mindfulverso" },
      { url: "https://kan-tasejkan.vercel.app/", label: "Kan Tasejkan" },
      { url: "https://inland-mex.vercel.app/", label: "Inland Mex" },
    ],
  },
  {
    id: "arte",
    label: "Arte & Creatividad",
    emoji: "🎨",
    color: "from-pink-500/20 to-pink-900/10",
    items: [
      { url: "https://instalacion-dimensiones.vercel.app", label: "Dimensiones" },
      { url: "https://aura-scanner-bice.vercel.app", label: "Aura Scanner" },
      { url: "https://kinetic-poiesis.vercel.app", label: "Kinetic Poiesis" },
      { url: "https://audioreactive-visualizer.vercel.app", label: "Audioreactive" },
      { url: "https://quantum-looper.netlify.app", label: "Quantum Looper" },
      { url: "https://circulo-de-quintas-one.vercel.app", label: "Círculo de Quintas" },
    ],
  },
  {
    id: "juegos",
    label: "Juegos",
    emoji: "🎮",
    color: "from-purple-500/20 to-purple-900/10",
    items: [
      { url: "https://la-reta.vercel.app", label: "La Reta" },
      { url: "https://guardabosques.vercel.app", label: "Guardabosques" },
      { url: "https://mariachi-vs-inflation.vercel.app", label: "Mariachi vs Inflation" },
    ],
  },
  {
    id: "gobernanza",
    label: "Gobernanza",
    emoji: "⚖️",
    color: "from-orange-500/20 to-orange-900/10",
    items: [
      { url: "https://orien-wine.vercel.app/", label: "Orien" },
      { url: "https://bnb-research-commons-five.vercel.app", label: "BNB Research Commons" },
    ],
  },
  {
    id: "herramientas",
    label: "Herramientas",
    emoji: "🛠️",
    color: "from-cyan-500/20 to-cyan-900/10",
    items: [
      { url: "https://bitacora-pearl.vercel.app/", label: "Bitácora" },
      { url: "https://orden-os.vercel.app/", label: "OrdenOS" },
    ],
  },
];

function getScreenshotUrl(url: string): string {
  // Manual fallback for pages that don't render well in headless browsers
  const manualScreenshots: Record<string, string> = {
    "https://care-pilot-nu.vercel.app": "/care-pilot-screenshot.png",
    "https://arvi-eight.vercel.app": "/arvi-screenshot.png",
    "https://aura-tau-five.vercel.app": "/aura-screenshot.png",
    "https://aura-scanner-bice.vercel.app": "/aura-scanner-screenshot.png",
    "https://rls-jerusalem-336-ivory.vercel.app": "/rls-jerusalem-screenshot.png",
  };

  // Check if we have a manual screenshot for this URL
  const match = Object.keys(manualScreenshots).find((key) => url.startsWith(key));
  if (match) return manualScreenshots[match];

  return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
}

export default function PortfolioSection() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const displayCategories = activeCategory
    ? categories.filter((c) => c.id === activeCategory)
    : categories;

  return (
    <div className="w-full space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-4">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1 rounded-full text-xs transition-all ${
            activeCategory === null
              ? "bg-white/10 text-white ring-1 ring-white/20"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            className={`px-3 py-1 rounded-full text-xs transition-all ${
              activeCategory === cat.id
                ? "bg-white/10 text-white ring-1 ring-white/20"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Categories with horizontal scroll */}
      <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
        {displayCategories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {/* Category header */}
            <h3 className="text-sm font-semibold text-gray-300 px-1">
              {category.emoji} {category.label}
              <span className="text-gray-600 ml-2 text-xs font-normal">({category.items.length})</span>
            </h3>

            {/* Horizontal scroll row */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {category.items.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 group"
                >
                  <div className={`w-52 rounded-xl overflow-hidden bg-gradient-to-b ${category.color} border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
                    {/* Screenshot */}
                    <div className="w-full h-32 bg-gray-900/50 overflow-hidden">
                      <img
                        src={getScreenshotUrl(item.url)}
                        alt={item.label}
                        className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
                        loading="lazy"
                      />
                    </div>
                    {/* Label */}
                    <div className="px-3 py-2">
                      <p className="text-white text-xs font-medium truncate">{item.label}</p>
                      <p className="text-gray-500 text-[10px] truncate mt-0.5">
                        {item.url.replace(/https?:\/\//, "").replace(/\/$/, "")}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
