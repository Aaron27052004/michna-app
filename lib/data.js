const RAW = [
["Zeraïm","Berakhot:9,Peah:8,Demai:7,Kilayim:9,Sheviit:10,Terumot:11,Maasrot:5,Maaser_Sheni:5,Challah:4,Orlah:3,Bikkurim:4"],
["Moed","Shabbat:24,Eruvin:10,Pesachim:10,Shekalim:8,Yoma:8,Sukkah:5,Beitzah:5,Rosh_Hashanah:4,Taanit:4,Megillah:4,Moed_Katan:3,Chagigah:3"],
["Nashim","Yevamot:16,Ketubot:13,Nedarim:11,Nazir:9,Sotah:9,Gittin:9,Kiddushin:4"],
["Nezikin","Bava_Kamma:10,Bava_Metzia:10,Bava_Batra:10,Sanhedrin:11,Makkot:3,Shevuot:8,Eduyot:8,Avodah_Zarah:5,Avot:6,Horayot:3"],
["Kodashim","Zevachim:14,Menachot:13,Chullin:12,Bekhorot:9,Arakhin:9,Temurah:7,Keritot:6,Meilah:6,Tamid:7,Middot:5,Kinnim:3"],
["Tohorot","Kelim:30,Oholot:18,Negaim:14,Parah:12,Tahorot:10,Mikvaot:10,Niddah:10,Makhshirin:6,Zavim:5,Tevul_Yom:4,Yadayim:4,Oktzin:3"],
];
// Noms Sefaria différents du schéma "Mishnah_X" / "Bartenura_on_Mishnah_X"
const OVR = { Avot: { m: "Pirkei_Avot", b: "Bartenura_on_Pirkei_Avot" } };

export const SEDARIM = RAW.map(([seder, s]) => ({
  seder,
  tractates: s.split(",").map((x) => {
    const [name, c] = x.split(":");
    return { name, n: name.replace(/_/g, " "), c: +c, seder, ...OVR[name] };
  }),
}));
export const ALL = SEDARIM.flatMap((s) => s.tractates);
export const getT = (name) => ALL.find((t) => t.name === name);
