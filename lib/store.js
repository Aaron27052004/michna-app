"use client";
import { useState, useEffect, useCallback } from "react";

const read = (k, i) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : i; } catch { return i; } };

// État persistant, synchronisé entre tous les composants de la page
export function useLS(key, init) {
  const [v, setV] = useState(init);
  useEffect(() => {
    const f = () => setV(read(key, init));
    f();
    window.addEventListener("ls:" + key, f);
    return () => window.removeEventListener("ls:" + key, f);
  }, [key]);
  const set = useCallback((n) => {
    const x = typeof n === "function" ? n(read(key, init)) : n;
    try { localStorage.setItem(key, JSON.stringify(x)); } catch {}
    window.dispatchEvent(new Event("ls:" + key));
  }, [key]);
  return [v, set];
}
export const today = () => new Date().toLocaleDateString("sv"); // AAAA-MM-JJ
