"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type PortfolioItem = {
  url: string;
  label: string;
  image: string;
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
    id: "cliente",
    label: "Clientes",
    emoji: "💼",
    color: "from-amber-500/20 to-amber-900/10",
    items: [
      { url: "https://maestria-culinaria-fast.vercel.app", label: "Maestría Culinaria", image: "/maestria-culinaria-screenshot.webp" },
      { url: "https://ecotourmex.vercel.app", label: "Ecotourmex", image: "/ecotour-screenshot.webp" },
      { url: "https://kostik.mx", label: "Kostik", image: "/kostik-screenshot.webp" },
      { url: "https://inland-mex.vercel.app", label: "Inland Mex", image: "/inlandmex-preview.webp" },
      { url: "https://kan-tasejkan.vercel.app", label: "Kan Tasejkan", image: "/kan-kasejtan-preview.webp" },
      { url: "https://mindfulverso-zeta.vercel.app", label: "Mindfulverso", image: "/mindfulverso-front.webp" },
      { url: "https://martina-store-2.vercel.app", label: "Martina Store", image: "/martina-store-front.webp" },
      { url: "https://rls-jerusalem-336-ivory.vercel.app", label: "RLS Jerusalem", image: "/rls-jerusalem-screenshot-preview.webp" },
      { url: "https://patrimo.pro", label: "Patrimo", image: "/patrimo-front.webp" },
      { url: "https://rizoma-shipyard-ynwq.vercel.app", label: "Rizoma", image: "/rizoma-front.webp" },
    ],
  },
  {
    id: "ambiental",
    label: "Impacto Ambiental",
    emoji: "🌱",
    color: "from-green-500/20 to-green-900/10",
    items: [
      { url: "https://aura-tau-five.vercel.app", label: "Aura", image: "/aura-screenshot-preview.webp" },
      { url: "https://arvi-eight.vercel.app", label: "Arvi", image: "/arvi-screenshot-preview.webp" },
      { url: "https://aona.vercel.app", label: "Aona", image: "/aona-front.webp" },
      { url: "https://sen-network1.vercel.app", label: "SEN Network", image: "/sen-network-front.webp" },
      { url: "https://rembu-app.vercel.app", label: "Rembu", image: "/rembu-front.webp" },
    ],
  },
  {
    id: "social",
    label: "Impacto Social",
    emoji: "🤝",
    color: "from-blue-500/20 to-blue-900/10",
    items: [
      { url: "https://care-pilot-nu.vercel.app", label: "CarePilot", image: "/care-pilot-screenshot-preview.webp" },
      { url: "https://seedr-three.vercel.app", label: "Seedr", image: "/seedr-front.webp" },
      { url: "https://www.side-b.art", label: "Side-B", image: "/side-b-front.webp" },
      { url: "https://sigilo-zeta.vercel.app", label: "Sigilo", image: "/sigilo-front.webp" },
      { url: "https://supply-cycle.vercel.app", label: "Supply Cycle", image: "/supply-cycle-front.webp" },
      { url: "https://bitbitmami.netlify.app", label: "BitBitMami", image: "/bitbitmami-front.webp" },
    ],
  },
  {
    id: "arte",
    label: "Arte & Creatividad",
    emoji: "🎨",
    color: "from-pink-500/20 to-pink-900/10",
    items: [
      { url: "https://instalacion-dimensiones.vercel.app", label: "Dimensiones", image: "/Dimensiones-preview.webp" },
      { url: "https://aura-scanner-bice.vercel.app", label: "Aura Scanner", image: "/aura-scanner-screenshot-preview.webp" },
      { url: "https://kinetic-poiesis.vercel.app", label: "Kinetic Poiesis", image: "/kinetic-poiesis-front.webp" },
      { url: "https://audioreactive-visualizer.vercel.app", label: "Audioreactive", image: "/audioreactive-preview.webp" },
      { url: "https://quantum-looper.netlify.app", label: "Quantum Looper", image: "/quantum-looper-front.webp" },
      { url: "https://circulo-de-quintas-one.vercel.app", label: "Circulo de Quintas", image: "/circulo-de-quintas-front.webp" },
    ],
  },
  {
    id: "juegos",
    label: "Juegos",
    emoji: "🎮",
    color: "from-purple-500/20 to-purple-900/10",
    items: [
      { url: "https://la-reta.vercel.app", label: "La Reta", image: "/la-reta-front.webp" },
      { url: "https://guardabosques.vercel.app", label: "Guardabosques", image: "/guardabosques-front.webp" },
      { url: "https://mariachi-vs-inflation.vercel.app", label: "Mariachi vs Inflation", image: "/mariachi-vs-inflation-front.webp" },
    ],
  },
  {
    id: "gobernanza",
    label: "Gobernanza",
    emoji: "⚖️",
    color: "from-orange-500/20 to-orange-900/10",
    items: [
      { url: "https://orien-wine.vercel.app", label: "Orien", image: "/orien-front.webp" },
      { url: "https://bnb-research-commons-five.vercel.app", label: "BNB Research Commons", image: "/bnb-research-commons-front.webp" },
    ],
  },
  {
    id: "herramientas",
    label: "Herramientas",
    emoji: "🛠️",
    color: "from-cyan-500/20 to-cyan-900/10",
    items: [
      { url: "https://taak-crm.vercel.app", label: "TAAK CRM", image: "/taak-crm-front.webp" },
      { url: "https://nexus-topaz-theta.vercel.app", label: "Nexus", image: "/nexus-front.webp" },
      { url: "https://bitacora-pearl.vercel.app", label: "Bitacora", image: "/bitacora-front.webp" },
      { url: "https://orden-os.vercel.app", label: "OrdenOS", image: "/ordenos-front.webp" },
    ],
  },
];

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
                        src={item.image}
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
