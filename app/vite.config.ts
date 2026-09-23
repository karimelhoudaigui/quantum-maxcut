import { execSync } from "node:child_process";

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Utilisé pour afficher dans l'UI HPC quelle version du front tourne (date de
// build, hash et date du commit) — cf. app/src/lib/buildInfo.ts. `envVar` a
// priorité (ex: injecté par app/Dockerfile via --build-arg sur OpenShift, où
// le contexte Docker est limité à app/ et n'a pas accès au .git du dépôt) ;
// sinon on retombe sur git (fonctionne en dev local, `npm run dev` sous
// docker-compose, et le build GitHub Pages qui checkout le dépôt complet).
function readBuildMeta(envVar: string, gitCommand: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv) return fromEnv;
  try {
    return execSync(gitCommand, { cwd: __dirname, timeout: 3000, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  const base = env.VITE_BASE_PATH || (mode === "production" ? "/quantum-maxcut/" : "/");

  const buildInfo = {
    commitHash: readBuildMeta("VITE_COMMIT_HASH", "git rev-parse --short=12 HEAD"),
    commitDate: readBuildMeta("VITE_COMMIT_DATE", "git log -1 --format=%cI"),
    buildDate: new Date().toISOString(),
  };

  return {
    base,
    plugins: [react()],
    define: {
      // Vite `define` fait une substitution textuelle brute : la valeur ici
      // remplace __BUILD_INFO__ telle quelle dans le code, sans guillemets
      // ajoutés. Un seul JSON.stringify(buildInfo) produit donc un objet
      // JS littéral collé dans le bundle (ex. __BUILD_INFO__ devient
      // {commitHash:"...",...}), pas une chaîne — buildInfo.ts fait ensuite
      // JSON.parse(__BUILD_INFO__), qui reçoit cet objet au lieu d'une
      // chaîne, échoue silencieusement (catch -> fallback "unknown"), d'où
      // le badge bloqué sur "unknown" quel que soit le contenu réel du
      // build. Double stringify : le premier sérialise buildInfo en JSON,
      // le second entoure CE JSON de guillemets pour que la substitution
      // produise une vraie chaîne JS que JSON.parse peut réellement parser.
      __BUILD_INFO__: JSON.stringify(JSON.stringify(buildInfo)),
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
