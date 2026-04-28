#!/usr/bin/env node

import { brotliCompress, gzip } from "node:zlib";
import { execFileSync } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const gzipAsync = promisify(gzip);
const brotliCompressAsync = promisify(brotliCompress);

const workspaceRoot = process.cwd();
const defaultConfigPath = "bundle-size.config.json";
const defaultOutputDir = "logs/bundle-sizes";

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const bundleSizeConfig = await readBundleSizeConfig(
  options.configPath ?? defaultConfigPath,
);
const outputDir = path.resolve(
  workspaceRoot,
  options.outputDir ?? bundleSizeConfig.outDir ?? defaultOutputDir,
);
const packageFilter =
  options.packages.length > 0 ? new Set(options.packages) : null;
const gitMetadata = getGitMetadata();
const packageManifests = await findPackageManifests(workspaceRoot);
const packageManifestsByName =
  await getPackageManifestsByName(packageManifests);
const packageResults = [];
const skippedResults = [];

for (const [packageName, packageConfig] of Object.entries(
  bundleSizeConfig.packages,
)) {
  if (packageFilter && !packageFilter.has(packageName)) {
    continue;
  }

  const manifestPath = packageManifestsByName.get(packageName);

  if (!manifestPath) {
    console.warn(`Skipping ${packageName}: no package.json found`);
    continue;
  }

  const packageRoot = path.dirname(manifestPath);
  const packageJson = await readJson(manifestPath);

  if (
    await hasLoggedPackageVersion(
      outputDir,
      packageName,
      packageJson.version ?? null,
    )
  ) {
    skippedResults.push({
      packageName,
      version: packageJson.version ?? null,
    });
    continue;
  }

  const distRoot = path.resolve(workspaceRoot, packageConfig.distDir);

  if (!(await pathExists(distRoot))) {
    console.warn(
      `Skipping ${packageName}: no dist directory at ${path.relative(workspaceRoot, distRoot)}`,
    );
    continue;
  }

  const bundleFiles = await resolveBundleFiles(distRoot, packageConfig.files);
  const files = await measureBundleFiles(bundleFiles);

  if (files.length === 0) {
    console.warn(
      `Skipping ${packageName}: no configured bundle files matched in ${path.relative(workspaceRoot, distRoot)}`,
    );
    continue;
  }

  const projectName = await getProjectName(packageRoot, packageName);
  const entry = {
    schemaVersion: 1,
    recordedAt: new Date().toISOString(),
    commit: gitMetadata.commit,
    branch: gitMetadata.branch,
    releaseTag: findReleaseTag(
      gitMetadata.allTags,
      projectName,
      packageJson.version,
    ),
    packageName,
    projectName,
    version: packageJson.version ?? null,
    bytes: sumFiles(files),
    files,
  };

  await appendPackageEntry(outputDir, packageName, entry);
  packageResults.push(entry);
}

if (packageResults.length === 0) {
  if (skippedResults.length > 0) {
    console.log(
      "No package bundle sizes were logged because all matching package versions already have entries.",
    );
    process.exit(0);
  }

  console.error(
    "No package bundle sizes were logged. Build packages first, or pass package names that have dist output.",
  );
  process.exit(1);
}

for (const result of packageResults) {
  const logPath = getPackageLogPath(outputDir, result.packageName);
  console.log(
    [
      result.packageName,
      `${result.bytes.raw} raw bytes`,
      `${result.bytes.gzip} gzip bytes`,
      `${result.bytes.brotli} brotli bytes`,
      `${result.files.length} files`,
      path.relative(workspaceRoot, logPath),
    ].join(" | "),
  );
}

for (const result of skippedResults) {
  console.log(
    [
      result.packageName,
      `version ${result.version ?? "unknown"} already logged`,
      "skipped",
    ].join(" | "),
  );
}

function parseArgs(args) {
  const parsed = {
    help: false,
    configPath: undefined,
    outputDir: undefined,
    packages: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--config") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--config requires a value");
      }
      parsed.configPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--config=")) {
      parsed.configPath = arg.slice("--config=".length);
      continue;
    }

    if (arg === "--out-dir") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--out-dir requires a value");
      }
      parsed.outputDir = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--out-dir=")) {
      parsed.outputDir = arg.slice("--out-dir=".length);
      continue;
    }

    if (arg === "--package") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--package requires a value");
      }
      parsed.packages.push(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--package=")) {
      parsed.packages.push(arg.slice("--package=".length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage: node scripts/log-bundle-sizes.mjs [options]

Appends bundle-size entries to logs/bundle-sizes/{package-name}.json.

Options:
  --config <path>        Config file. Default: ${defaultConfigPath}
  --out-dir <path>       Output directory. Overrides config outDir.
  --package <name>       Only log one configured package. Can be repeated.
  -h, --help             Show this help.

Notes:
  - Packages and file regexes are read from ${defaultConfigPath}.
  - Run package builds before this script.
  - File patterns match paths relative to each configured distDir.
  - The configured file name is stored in the log instead of hashed build paths.
  - Log entries contain numeric byte totals and measured file paths, for graphing.
  - Scoped packages use their package name as a nested path, e.g. logs/bundle-sizes/@8f4e/compiler.json.`);
}

async function findPackageManifests(root) {
  const manifests = [];

  if (await pathExists(path.join(root, "package.json"))) {
    manifests.push(path.join(root, "package.json"));
  }

  await collectPackageManifests(path.join(root, "packages"), manifests);

  return manifests.sort((a, b) => {
    const aDepth = path.relative(root, a).split(path.sep).length;
    const bDepth = path.relative(root, b).split(path.sep).length;
    if (aDepth !== bDepth) {
      return aDepth - bDepth;
    }
    return a.localeCompare(b);
  });
}

async function collectPackageManifests(dir, manifests) {
  if (!(await pathExists(dir))) {
    return;
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }

    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const manifestPath = path.join(entryPath, "package.json");
      if (await pathExists(manifestPath)) {
        manifests.push(manifestPath);
      }
      await collectPackageManifests(entryPath, manifests);
    }
  }
}

async function getPackageManifestsByName(packageManifests) {
  const manifestsByName = new Map();

  for (const manifestPath of packageManifests) {
    const packageJson = await readJson(manifestPath);

    if (packageJson.name) {
      manifestsByName.set(packageJson.name, manifestPath);
    }
  }

  return manifestsByName;
}

async function resolveBundleFiles(distRoot, fileRules) {
  const distFilePaths = await collectDistRuntimeFiles(distRoot);
  const bundleFiles = [];

  for (const rule of fileRules) {
    const pattern = new RegExp(rule.pattern);
    const matches = distFilePaths.filter(({ relativePath }) =>
      pattern.test(relativePath),
    );

    if (matches.length === 0) {
      console.warn(
        `No files matched ${rule.pattern} in ${path.relative(workspaceRoot, distRoot)}`,
      );
      continue;
    }

    if (matches.length > 1) {
      throw new Error(
        `Pattern ${rule.pattern} in ${path.relative(workspaceRoot, distRoot)} matched multiple files: ${matches
          .map((match) => match.relativePath)
          .join(", ")}`,
      );
    }

    bundleFiles.push({
      name: rule.name,
      filePath: matches[0].filePath,
    });
  }

  return bundleFiles.sort((a, b) => a.name.localeCompare(b.name));
}

async function collectDistRuntimeFiles(distRoot) {
  const files = [];
  await collectRuntimeFiles(distRoot, distRoot, files);
  return files;
}

async function collectRuntimeFiles(root, dir, files) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await collectRuntimeFiles(root, entryPath, files);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relativePath = path
      .relative(root, entryPath)
      .split(path.sep)
      .join("/");

    if (isRuntimeFile(relativePath)) {
      files.push({ relativePath, filePath: entryPath });
    }
  }
}

async function measureBundleFiles(bundleFiles) {
  const files = [];

  for (const { name, filePath } of bundleFiles) {
    const bytes = await fs.readFile(filePath);
    const gzipBytes = await gzipAsync(bytes);
    const brotliBytes = await brotliCompressAsync(bytes);

    files.push({
      path: name,
      raw: bytes.byteLength,
      gzip: gzipBytes.byteLength,
      brotli: brotliBytes.byteLength,
    });
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function isRuntimeFile(fileName) {
  if (fileName.endsWith(".map") || fileName.endsWith(".d.ts")) {
    return false;
  }

  return true;
}

function sumFiles(files) {
  return files.reduce(
    (totals, file) => ({
      raw: totals.raw + file.raw,
      gzip: totals.gzip + file.gzip,
      brotli: totals.brotli + file.brotli,
    }),
    {
      raw: 0,
      gzip: 0,
      brotli: 0,
    },
  );
}

async function appendPackageEntry(outputRoot, packageName, entry) {
  const logPath = getPackageLogPath(outputRoot, packageName);
  await fs.mkdir(path.dirname(logPath), { recursive: true });

  const existingEntries = (await pathExists(logPath))
    ? await readJson(logPath)
    : [];

  if (!Array.isArray(existingEntries)) {
    throw new Error(
      `${path.relative(workspaceRoot, logPath)} must contain a JSON array`,
    );
  }

  existingEntries.push(entry);
  await fs.writeFile(
    logPath,
    `${JSON.stringify(existingEntries, null, "\t")}\n`,
  );
}

async function hasLoggedPackageVersion(outputRoot, packageName, version) {
  if (!version) {
    return false;
  }

  const logPath = getPackageLogPath(outputRoot, packageName);

  if (!(await pathExists(logPath))) {
    return false;
  }

  const existingEntries = await readJson(logPath);

  if (!Array.isArray(existingEntries)) {
    throw new Error(
      `${path.relative(workspaceRoot, logPath)} must contain a JSON array`,
    );
  }

  const latestEntry = existingEntries.at(-1);
  return latestEntry?.version === version;
}

function getPackageLogPath(outputRoot, packageName) {
  const pathSegments = packageName.split("/").map((segment) => {
    if (!segment || segment === "." || segment === "..") {
      throw new Error(`Invalid package name segment in ${packageName}`);
    }
    return segment;
  });
  const fileName = `${pathSegments.pop()}.json`;
  return path.join(outputRoot, ...pathSegments, fileName);
}

async function getProjectName(packageRoot, packageName) {
  const projectJsonPath = path.join(packageRoot, "project.json");

  if (!(await pathExists(projectJsonPath))) {
    return packageName;
  }

  const projectJson = await readJson(projectJsonPath);
  return projectJson.name ?? packageName;
}

function findReleaseTag(tags, projectName, version) {
  if (!version) {
    return null;
  }

  const expectedTag = `${projectName}@${version}`;
  return tags.includes(expectedTag) ? expectedTag : null;
}

function getGitMetadata() {
  return {
    commit: runGit(["rev-parse", "HEAD"]),
    branch: runGit(["branch", "--show-current"]),
    allTags: runGit(["tag", "--list"])
      .split("\n")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .sort(),
  };
}

function runGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: workspaceRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

async function readBundleSizeConfig(configPath) {
  const resolvedConfigPath = path.resolve(workspaceRoot, configPath);
  const config = await readJson(resolvedConfigPath);

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error(`${configPath} must contain an object`);
  }

  if (!config.packages || typeof config.packages !== "object") {
    throw new Error(`${configPath} must define a packages object`);
  }

  for (const [packageName, packageConfig] of Object.entries(config.packages)) {
    if (!packageConfig || typeof packageConfig !== "object") {
      throw new Error(`${configPath}: ${packageName} must contain an object`);
    }

    if (typeof packageConfig.distDir !== "string" || !packageConfig.distDir) {
      throw new Error(`${configPath}: ${packageName}.distDir must be a string`);
    }

    if (
      !Array.isArray(packageConfig.files) ||
      packageConfig.files.length === 0
    ) {
      throw new Error(
        `${configPath}: ${packageName}.files must be a non-empty array`,
      );
    }

    for (const fileRule of packageConfig.files) {
      if (!fileRule || typeof fileRule !== "object") {
        throw new Error(
          `${configPath}: ${packageName}.files entries must be objects`,
        );
      }

      if (typeof fileRule.name !== "string" || !fileRule.name) {
        throw new Error(
          `${configPath}: ${packageName}.files[].name must be a string`,
        );
      }

      if (typeof fileRule.pattern !== "string" || !fileRule.pattern) {
        throw new Error(
          `${configPath}: ${packageName}.files[].pattern must be a string`,
        );
      }

      new RegExp(fileRule.pattern);
    }
  }

  return config;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
