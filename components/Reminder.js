"use client";
import { useEffect } from "react";
import { useLS, today } from "@/lib/store";

// Rappel quotidien récurrent, à importer dans l'agenda du téléphone (fiable même app fermée)
export function downloadIcs(at) {
  const [h, m] = at.split(":");
  const d = today().replaceAll("-", "");
  const s = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Michna//FR", "BEGIN:VEVENT", "UID:michna-daily@local",
    `DTSTAMP:${d}T000000Z`, `DTSTART:${d}T${h.padStart(2, "0")}${m}00`, "RRULE:FREQ=DAILY",
    "SUMMARY:Michna du jour", "DESCRIPTION:" + location.origin + "/daily",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Michna du jour", "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([s], { type: "text/calendar" }));
  a.download = "michna.ics";
  a.click();
}

// Notification dans le navigateur (quand l'onglet/l'app est ouvert)
export default function Reminder() {
  const [plan] = useLS("plan", {});
  useEffect(() => {
    if (!plan.remind || !("Notification" in window) || Notification.permission !== "granted") return;
    const fire = () => {
      const k = "notified:" + today();
      if (plan.done === today() || localStorage.getItem(k)) return;
      localStorage.setItem(k, "1");
      new Notification("Michna du jour", { body: `${plan.per || 2} mishnayot t'attendent.` });
    };
    const [h, m] = (plan.at || "08:00").split(":");
    const t = new Date(); t.setHours(+h, +m, 0, 0);
    const ms = t - Date.now();
    if (ms > 0) { const id = setTimeout(fire, ms); return () => clearTimeout(id); }
    fire(); // heure déjà passée : rappel à l'ouverture
  }, [plan.remind, plan.at, plan.done, plan.per]);
  return null;
}
