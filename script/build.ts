import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, copyFile, mkdir, access, cp } from "fs/promises";
import { execSync } from "child_process";

// Server deps to bundle to reduce openat(2) syscalls
// which helps cold start times on serverless platforms
const allowlist = [
  "connect-pg-simple",
  "cors",
  "date-fns",
  "dotenv",
  "express",
  "express-session",
  "memorystore",
  "nanoid",
  "passport",
  "passport-google-oauth20",
  "passport-local",
  "pg",
  "ws",
  "zod",
  "zod-validation-error",
];

// These are always kept external (native modules, prisma runtime)
const alwaysExternal = [
  "@prisma/client",
  "@prisma/adapter-pg",
  "prisma",
];

// Timing utility
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function step<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  console.log(`\n📦 ${name}...`);
  try {
    const result = await fn();
    console.log(`   ✅ Done in ${formatDuration(Date.now() - start)}`);
    return result;
  } catch (error) {
    console.error(`   ❌ Failed after ${formatDuration(Date.now() - start)}`);
    throw error;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function buildAll() {
  const totalStart = Date.now();
  console.log("🚀 Starting build process...\n");

  // Step 1: Clean dist directory
  await step("Cleaning dist directory", async () => {
    await rm("dist", { recursive: true, force: true });
  });

  // Step 2: Build client with Vite
  await step("Building client (Vite)", async () => {
    await viteBuild({
      logLevel: "info",
      build: {
        sourcemap: true,
      },
    });
  });

  // Step 3: Generate Prisma client
  await step("Generating Prisma client", async () => {
    execSync("npx prisma generate", { stdio: "inherit" });
  });

  // Step 4: Build server with esbuild (ESM format for Prisma v7 compatibility)
  await step("Building server (esbuild)", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    const allDeps = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ];

    // External deps that should NOT be bundled
    const externals = [
      ...allDeps.filter((dep) => !allowlist.includes(dep)),
      ...alwaysExternal,
    ];

    await esbuild({
      entryPoints: ["server/index.ts"],
      platform: "node",
      target: "node18",
      bundle: true,
      format: "esm", // ESM for import.meta support (required by Prisma v7)
      outfile: "dist/index.mjs",
      banner: {
        // Shim for __dirname in ESM
        js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
      },
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      minify: true,
      sourcemap: true,
      external: [...new Set(externals)], // dedupe
      logLevel: "info",
      metafile: true,
    });
  });

  // Step 5: Copy Prisma schema for migrations
  await step("Copying Prisma assets", async () => {
    await mkdir("dist/prisma", { recursive: true });
    await copyFile("prisma/schema.prisma", "dist/prisma/schema.prisma");
  });

  // Step 6: Copy generated Prisma client for production
  await step("Copying generated Prisma client", async () => {
    await cp("generated", "dist/generated", { recursive: true });
  });

  // Step 7: Validate build output
  await step("Validating build output", async () => {
    const requiredFiles = [
      "dist/index.mjs",
      "dist/public/index.html",
      "dist/prisma/schema.prisma",
      "dist/generated/prisma/client.ts",
    ];

    const missing: string[] = [];
    for (const file of requiredFiles) {
      if (!(await fileExists(file))) {
        missing.push(file);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required files:\n  ${missing.join("\n  ")}`);
    }

    console.log("   All required files present");
  });

  // Summary
  const totalTime = Date.now() - totalStart;
  console.log(`\n${"═".repeat(50)}`);
  console.log(`✨ Build completed successfully in ${formatDuration(totalTime)}`);
  console.log(`${"═".repeat(50)}\n`);
  console.log("Output:");
  console.log("  📁 dist/");
  console.log("  ├── 📄 index.mjs (server bundle - ESM)");
  console.log("  ├── 📄 index.mjs.map (source map)");
  console.log("  ├── 📁 public/ (client assets)");
  console.log("  ├── 📁 prisma/ (schema)");
  console.log("  └── 📁 generated/ (Prisma client)");
  console.log("\nTo start the server:");
  console.log("  node dist/index.mjs\n");
}

buildAll().catch((err) => {
  console.error("\n❌ Build failed:", err.message || err);
  process.exit(1);
});
