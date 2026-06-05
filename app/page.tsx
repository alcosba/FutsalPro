import React, { useState } from "react";
import Board from "@/components/Board";
import Calendar from "@/components/Calendar";
import Stats from "@/components/Stats";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function Home() {
      case "calendar":
        return <Calendar />;
      case "stats":
        return <Stats />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white dark:bg-gray-900">
      <header className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="text-2xl font-semibold">Futsal Coach</h1>
        <DarkModeToggle />
      </header>
      <nav className="flex justify-center space-x-4 bg-gray-800 p-2">
        <button
          className={`px-4 py-2 rounded ${activeTab === "board" ? "bg-gray-700" : "hover:bg-gray-700"}`}
          onClick={() => setActiveTab("board")}
        >
          Pizarra
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "calendar" ? "bg-gray-700" : "hover:bg-gray-700"}`}
          onClick={() => setActiveTab("calendar")}
        >
          Calendario
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "stats" ? "bg-gray-700" : "hover:bg-gray-700"}`}
          onClick={() => setActiveTab("stats")}
        >
          Estadísticas
        </button>
      </nav>
      <main className="flex-1 p-4 overflow-auto">{renderTab()}</main>
    </div>
  );
}
