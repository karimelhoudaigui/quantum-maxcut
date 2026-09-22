export interface BuildInfo {
  /** Hash court (ou complet, selon la source) du commit buildé, "unknown" si indisponible. */
  commitHash: string;
  /** Date ISO du commit buildé, "unknown" si indisponible (cf. vite.config.ts). */
  commitDate: string;
  /** Date ISO à laquelle ce build du front a été produit (npm run build / npm run dev). */
  buildDate: string;
}

const fallback: BuildInfo = { commitHash: "unknown", commitDate: "unknown", buildDate: "unknown" };

export const buildInfo: BuildInfo = (() => {
  try {
    return { ...fallback, ...JSON.parse(__BUILD_INFO__) };
  } catch {
    return fallback;
  }
})();

/** Formatte une date ISO de BuildInfo pour l'affichage ; passe "unknown" tel quel. */
export function formatBuildInfoDate(value: string): string {
  if (value === "unknown") return "unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
