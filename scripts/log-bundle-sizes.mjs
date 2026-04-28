#!/usr/bin/env node

import { brotliCompress, gzip } from "node:zlib";
import { execFileSync } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const gzipAsync = promisify(gzip);
const brotliCompressAsync = promisify(brotliCompress);

const workspaceRoot = process.cwd();
const defaultOutputDir = "logs/bundle-sizes";
const defaultPackages = [
  "8f4e",
  "@8f4e/editor",
  "@8f4e/editor-state",
  "@8f4e/compiler",
  "@8f4e/web-ui",
];

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const outputDir = path.resolve(
  workspaceRoot,
  options.outputDir ?? defaultOutputDir,
);
const packageFilter = new Set(
  options.packages.length > 0 ? options.packages : defaultPackages,
);
const gitMetadata = getGitMetadata();
const packageManifests = await findPackageManifests(workspaceRoot);
const packageResults = [];

for (const manifestPath of packageManifests) {
  const packageRoot = path.dirname(manifestPath);
  const packageJson = await readJson(manifestPath);
  const packageName = packageJson.name;

  if (
    !packageName ||
    (packageFilter.size > 0 && !packageFilter.has(packageName))
  ) {
    continue;
  }

  const distRoot = path.join(packageRoot, "dist");

  if (!(await pathExists(distRoot))) {
    console.warn(
      `Skipping ${packageName}: no dist directory at ${path.relative(workspaceRoot, distRoot)}`,
    );
    continue;
  }

  const bundleFilePaths = await resolveBundleFiles(
    packageRoot,
    distRoot,
    packageJson,
  );
  const files = await measureBundleFiles(distRoot, bundleFilePaths);

  if (files.length === 0) {
    console.warn(
      `Skipping ${packageName}: no main bundle files found in ${path.relative(workspaceRoot, distRoot)}`,
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

function parseArgs(args) {
  const parsed = {
    help: false,
    outputDir: undefined,
    packages: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
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
  --out-dir <path>       Output directory. Default: ${defaultOutputDir}
  --package <name>       Only log one package. Can be repeated. Overrides the default package list.
  -h, --help             Show this help.

Notes:
  - Default packages: ${defaultPackages.join(", ")}
  - Run package builds before this script.
  - Declared main bundle files and their local runtime imports are measured, not emitted chunks.
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

async function resolveBundleFiles(packageRoot, distRoot, packageJson) {
  const bundlePaths = new Set();

  for (const entryPath of getPackageEntryPaths(packageJson)) {
    const distRelativePath = normalizeDistEntryPath(entryPath);

    if (!distRelativePath || !isRuntimeFile(distRelativePath)) {
      continue;
    }

    const filePath = path.join(distRoot, ...distRelativePath.split("/"));

    if (await pathExists(filePath)) {
      bundlePaths.add(filePath);
    }
  }

  if (bundlePaths.size === 0 && packageRoot === workspaceRoot) {
    for (const filePath of await getViteHtmlModuleScripts(distRoot)) {
      bundlePaths.add(filePath);
    }
  }

  const files =
    packageRoot === workspaceRoot
      ? [...bundlePaths]
      : await expandLocalRuntimeGraph(distRoot, [...bundlePaths]);

  return files.sort((a, b) =>
    path.relative(distRoot, a).localeCompare(path.relative(distRoot, b)),
  );
}

async function expandLocalRuntimeGraph(distRoot, entryPaths) {
  const visited = new Set();
  const pending = [...entryPaths];

  while (pending.length > 0) {
    const filePath = pending.pop();

    if (!filePath || visited.has(filePath)) {
      continue;
    }

    visited.add(filePath);

    const sourceText = await fs.readFile(filePath, "utf8");
    for (const specifier of getLocalRuntimeSpecifiers(sourceText, filePath)) {
      const importedFilePath = await resolveRuntimeImport(
        distRoot,
        filePath,
        specifier,
      );

      if (importedFilePath && !visited.has(importedFilePath)) {
        pending.push(importedFilePath);
      }
    }
  }

  return [...visited];
}

function getLocalRuntimeSpecifiers(sourceText, filePath) {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const specifiers = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      collectRuntimeSpecifier(node.moduleSpecifier.text, specifiers);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      collectRuntimeSpecifier(node.arguments[0].text, specifiers);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function collectRuntimeSpecifier(specifier, specifiers) {
  if (specifier.startsWith(".")) {
    specifiers.push(specifier);
  }
}

async function resolveRuntimeImport(distRoot, importerPath, specifier) {
  const basePath = path.resolve(path.dirname(importerPath), specifier);
  const candidates = [
    basePath,
    `${basePath}.js`,
    `${basePath}.mjs`,
    `${basePath}.cjs`,
    path.join(basePath, "index.js"),
    path.join(basePath, "index.mjs"),
    path.join(basePath, "index.cjs"),
  ];

  for (const candidate of candidates) {
    if (!isPathInside(candidate, distRoot) || !isRuntimeFile(candidate)) {
      continue;
    }

    if (await pathIsFile(candidate)) {
      return candidate;
    }
  }

  return null;
}

function isPathInside(filePath, rootPath) {
  const relativePath = path.relative(rootPath, filePath);
  return (
    relativePath &&
    !relativePath.startsWith("..") &&
    !path.isAbsolute(relativePath)
  );
}

function getPackageEntryPaths(packageJson) {
  const entries = [];

  for (const field of ["main", "module", "browser"]) {
    collectEntryPaths(packageJson[field], entries);
  }

  collectEntryPaths(packageJson.exports, entries);
  collectEntryPaths(packageJson.bin, entries);

  return entries;
}

function collectEntryPaths(value, entries) {
  if (!value) {
    return;
  }

  if (typeof value === "string") {
    entries.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectEntryPaths(item, entries);
    }
    return;
  }

  if (typeof value === "object") {
    for (const item of Object.values(value)) {
      collectEntryPaths(item, entries);
    }
  }
}

function normalizeDistEntryPath(entryPath) {
  const cleanEntryPath = entryPath
    .split(/[?#]/, 1)[0]
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");

  if (cleanEntryPath.startsWith("dist/")) {
    return cleanEntryPath.slice("dist/".length);
  }

  return null;
}

async function getViteHtmlModuleScripts(distRoot) {
  const indexHtmlPath = path.join(distRoot, "index.html");

  if (!(await pathExists(indexHtmlPath))) {
    return [];
  }

  const indexHtml = await fs.readFile(indexHtmlPath, "utf8");
  const scriptRegex =
    /<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["']([^"']+)["'])[^>]*>/gi;
  const bundlePaths = [];

  for (const match of indexHtml.matchAll(scriptRegex)) {
    const distRelativePath = normalizeHtmlAssetPath(match[1]);

    if (!distRelativePath || !isRuntimeFile(distRelativePath)) {
      continue;
    }

    const filePath = path.join(distRoot, ...distRelativePath.split("/"));

    if (await pathExists(filePath)) {
      bundlePaths.push(filePath);
    }
  }

  return bundlePaths.sort((a, b) =>
    path.relative(distRoot, a).localeCompare(path.relative(distRoot, b)),
  );
}

function normalizeHtmlAssetPath(assetPath) {
  const cleanAssetPath = assetPath
    .split(/[?#]/, 1)[0]
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  if (
    !cleanAssetPath ||
    cleanAssetPath.startsWith("http://") ||
    cleanAssetPath.startsWith("https://")
  ) {
    return null;
  }

  return cleanAssetPath;
}

async function measureBundleFiles(distRoot, filePaths) {
  const files = [];

  for (const filePath of filePaths) {
    const bytes = await fs.readFile(filePath);
    const gzipBytes = await gzipAsync(bytes);
    const brotliBytes = await brotliCompressAsync(bytes);

    files.push({
      path: path.relative(distRoot, filePath).split(path.sep).join("/"),
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

async function pathIsFile(filePath) {
  try {
    return (await fs.stat(filePath)).isFile();
  } catch {
    return false;
  }
}
