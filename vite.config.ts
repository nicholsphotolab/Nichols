import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { generateStaticData } from "./scripts/generateStaticData";

// Mirrors next.config.js's basePath logic: the GitHub Actions Pages build
// serves the site from a /<repo>/ subpath (nicholsphotolab.github.io/Nichols/),
// so asset/route URLs need that prefix. The Network Solutions deploy serves
// from the domain root and must NOT get a base, so this only kicks in inside
// GitHub Actions.
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const base = isGithubActions && repo ? `/${repo}/` : "/";

// Regenerates the film hero-slide and gallery JSON (src/data/generated/)
// from the image files under public/FILM/ — see generateStaticData.ts. Runs
// once at dev-server start and at the top of every build; in dev it also
// watches those folders and reloads the page when photos are added/removed,
// matching the old per-request fs scan closely enough to add a photo and see
// it without restarting.
function staticDataPlugin(): Plugin {
  return {
    name: "nichols-static-data",
    buildStart() {
      generateStaticData();
    },
    configureServer(server) {
      generateStaticData();
      const watchDir = path.resolve(__dirname, "public/FILM");
      server.watcher.add(watchDir);
      server.watcher.on("all", (_event, file) => {
        if (!file.startsWith(watchDir)) return;
        generateStaticData();
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), staticDataPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "out",
  },
});
