import { getT } from "./data";
import talmedia from "./talmedia-fr.json";
import bartenuraEn from "./bartenura-en.json";
import bartenuraFr from "./bartenura-fr.json";
const API = "https://www.sefaria.org/api/v3/texts/";

// Garde uniquement b/i/small/big, retire notes de bas de page et autres balises
const clean = (s) =>
  String(s ?? "")
    .replace(/<sup[^>]*footnote-marker[^>]*>.*?<\/sup>/gi, "")
    .replace(/<i class="footnote">.*?<\/i>/gi, "")
    .replace(/<(?!\/?(b|i|small|big)\b)[^>]*>/gi, "")
    .replace(/&nbsp;/g, " ")
    .trim();
const flat = (x) => (Array.isArray(x) ? x.flatMap(flat) : [x]);

async function get(ref, versions) {
  const q = versions.map((v) => "version=" + v).join("&");
  const r = await fetch(`${API}${ref}?${q}`, { next: { revalidate: 86400 } });
  return r.ok ? r.json() : null;
}

export async function chapter(t, c, bartLang = "he") {
  const T = getT(t);
  const [m, b] = await Promise.all([
    get(`${T.m ?? "Mishnah_" + t}.${c}`, ["primary", "english"]),
    get(`${T.b ?? "Bartenura_on_Mishnah_" + t}.${c}`, ["primary"]),
  ]);
  const pick = (d, lang) => d?.versions?.find((v) => v.language === lang)?.text ?? [];
  const tractateKey = t.replace(/_/g, " ").toLowerCase();
  const bartChapter = (bartLang === "en" ? bartenuraEn : bartenuraFr)[tractateKey]?.[String(c)] ?? [];
  return {
    he: flat(pick(m, "he")).map(clean),
    en: pick(m, "en").map((x) => flat(x).map(clean).join(" ")),
    fr: talmedia[frTractateKey(t)]?.[String(c)] ?? [],
    bart: (b?.versions?.[0]?.text ?? []).map((x) => flat(x).map(clean).filter(Boolean)),
    bartTranslation: bartLang === "he"
      ? []
      : bartChapter.map((entry) => (
        bartLang === "fr" && !entry.credit?.startsWith("Traduction française à partir de ")
          ? null
          : entry
      )),
  };
}

function frTractateKey(t) {
  const key = String(t).replace(/_/g, " ").toLowerCase();
  if (key === "avot") return "pirkei avot";
  if (key === "terumot") return "teroumot";
  return key;
}
