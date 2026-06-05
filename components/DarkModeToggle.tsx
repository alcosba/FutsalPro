"use client";

// components/DarkModeToggle.tsx

import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    // Initialise from localStorage
    const stored = typeof window !== 'undefined' && localStorage.getItem('theme');
    if (stored === 'dark') setDark(true);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      className="px-3 py-1 border rounded bg-white/10 text-white hover:bg-white/20 transition"
      onClick={() => setDark(!dark)}
    >
      {dark ? 'Modo claro' : 'Modo oscuro'}
    </button>
  );
}
