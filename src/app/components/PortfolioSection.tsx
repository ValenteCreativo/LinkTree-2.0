"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Microlink from "@microlink/react";

type PortfolioItem = {
  url: string;
  category: string;
};

type CategoryInfo = {
  label: string;
  color: string;
  bgColor: string;
};

const portfolioItems: PortfolioItem[] = [
  // Impacto Ambiental
  { url: "https://aura-tau-five.vercel.app", category: "ambiental" },
  { url: "https://arvi-eight.vercel.app", category: "ambiental" },
  { url: "https://seedr-three.vercel.app", category: "ambiental" },
  { url: "https://rembu-app.vercel.app", category: "ambiental" },
  { url: "https://aona.vercel.app", category: "ambiental" },
  { url: "https://sen-network1.vercel.app", category: "ambiental" },
  // Impacto Social
  { url: "https://carepilot-tau.vercel.app", category: "social" },
  { url: "https://www.side-b.art", category: "social" },
  { url: "https://sigilo-zeta.vercel.app", category: "social" },
  { url: "https://supply-cycle.vercel.app", category: "social" },
  { url: "https://bitbitmami.netlify.app", category: "social" },
  // Cliente
  { url: "https://martina-store-2.vercel.app", category: "cliente" },
  { url: "https://rizoma-shipyard-ynwq.vercel.app", category: "cliente" },
  { url: "https://rls-jerusalem-336.vercel.app/public", category: "cliente" },
  { url: "https://patrimo.pro", category: "cliente" },
  // Arte
  { url: "https://instalacion-dimensiones.vercel.app", category: "arte" },
  { url: "https://kinetic-poiesis.vercel.app", category: "arte" },
  { url: "https://audioreactive-visualizer.vercel.app", category: "arte" },
  // Juegos
  { url: "https://la-reta.vercel.app", category: "juegos" },
  { url: "https://guardabosques.vercel.app", category: "juegos" },
  { url: "https://mariachi-vs-inflation.vercel.app", category: "juegos" },
  // Experimentos
  { url: "https://www.patas4land.xyz", category: "experimento" },
  { url: "https://quantum-looper.netlify.app", category: "experimento" },
  { url: "https://circulo-de-quintas-one.vercel.app", category: "experimento" },
  // Gobernanza
  { url: "https://bnb-research-commons-five.vercel.app", category: "gobernanza" },
];

const categories: Record<string, CategoryInfo> = {
  all: { label: "Todos", color: "text-white", bgColor: "bg-white/10" },
  ambiental: { label: "🌱 Ambiental", color: "text-green-400", bgColor: "bg-green-500/10" },
  social: { label: "🤝 Social", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  cliente: { label: "💼 Cliente", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  arte: { label: "🎨 Arte", color: "text-pink-400", bgColor: "bg-pink-500/10" },
  juegos: { label: "🎮 Juegos", color: "text-purple-400", bgColor: "bg-purple-500/10" },
  experimento: { label: "🧪 Experimento", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  gobernanza: { label: "⚖️ Gobernanza", color: "text-orange-400", bgColor: "bg-orange-500/10" },
};

export default function PortfolioSection() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredItems =
    activeCategory === "all"
      ? portfolioItems
      : portfolioItems.filter((item) => item.category === activeCategory);

  return (
    <div className="w-full">
      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeCategory === key
                ? `${cat.bgColor} ${cat.color} ring-1 ring-current`
                : "bg-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/10"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Project count */}
      <p className="text-center text-gray-500 text-xs mb-4">
        {filteredItems.length} proyecto{filteredItems.length !== 1 ? "s" : ""}
      </p>

      {/* Portfolio Grid */}
      <motion.div
        className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-1"
        layout
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.url}
              className="portfolio-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.03 }}
              layout
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Microlink
                  url={item.url}
                  size="large"
                  style={{
                    width: "100%",
                    borderRadius: "12px",
                    border: "none",
                    background: "transparent",
                    fontFamily: "inherit",
                  }}
                  media={["image", "logo"]}
                />
                <div className="px-4 pb-3 pt-1 flex items-center justify-between">
                  <span
                    className={`category-badge ${categories[item.category]?.bgColor} ${categories[item.category]?.color}`}
                  >
                    {categories[item.category]?.label}
                  </span>
                  <span className="text-gray-600 text-xs truncate max-w-[180px]">
                    {item.url.replace(/https?:\/\//, "").replace(/\/$/, "")}
                  </span>
                </div>
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
