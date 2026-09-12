import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const demos = ["elektricno-polje-kocka", "complex-vector-visualiser"];

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "math-visualizer-demos";
const siteBase = `/${repoName}`;

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
writeFileSync("dist/.nojekyll", "");

for (const slug of demos) {
  const basePath = `${siteBase}/${slug}/`;
  execSync(`npm run build -w ${slug}`, {
    stdio: "inherit",
    env: { ...process.env, VITE_BASE_PATH: basePath },
  });
  cpSync(join(slug, "dist"), join("dist", slug), { recursive: true });
}

cpSync("demos.json", "dist/demos.json");

const landingHtml = readFileSync("index.html", "utf8").replace(
  "__SITE_BASE__",
  siteBase,
);
writeFileSync("dist/index.html", landingHtml);

console.log(`Built site at dist/ for ${siteBase}/`);
