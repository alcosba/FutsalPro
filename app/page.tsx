"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useToast } from "@/components/shared/Toast";

const Board = dynamic(() => import("@/components/Board"), { ssr: false });
const Calendar = dynamic(() => import("@/components/Calendar"), { ssr: false });
const Stats = dynamic(() => import("@/components/Stats"), { ssr: false });

type Tab = "board" | "calendar" | "stats";

const NAV_ITEMS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "board", label: "Pizarra Táctica", icon: "📊" },
  { id: "calendar", label: "Calendario", icon: "📅" },
  { id: "stats", label: "Estadísticas", icon: "📈" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const { addToast } = useToast();
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration fix for Next.js
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "board":
        return <Board />;
      case "calendar":
        return <Calendar />;
      case "stats":
        return <Stats />;
      default:
        return null;
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <div className="text-3xl">⚽</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Futsal Coach
                </h1>
                <p className="text-xs text-gray-400">Gestor Táctico Profesional</p>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-gray-800 bg-gray-800/50 backdrop-blur sticky top-16 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 -mb-px">
            {NAV_ITEMS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                }`}
              >
                <span className="mr-2">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-800/50 py-4 text-center text-xs text-gray-500">
        <p>© 2026 Futsal Coach • Gestor táctico profesional para entrenadores</p>
      </footer>
    </div>
  );
}
