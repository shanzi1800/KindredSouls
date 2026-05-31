export type AlgLang = "zh" | "en" | "es" | "fr";

const SUPPORTED: AlgLang[] = ["zh", "en", "es", "fr"];

export function normalizeLang(raw: string): AlgLang {
  const base = raw.split("-")[0] as string;
  return SUPPORTED.includes(base as AlgLang) ? (base as AlgLang) : "en";
}
