#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const workspaceRoot = process.cwd();
const excludedProjects = new Set(["glugglug"]);
const rootProjectFiles = new Set([
  "index.html",
  "vite.config.ts",
  "vitest.config.ts",
  "tsconfig.build.json",
]);
const rootProjectDirs = ["src/", "docs/"];
const options = parseArgs(process.argv.slice(2));
const projects = await findReleaseProjects(workspaceRoot);
const releaseProjects = resolveReleaseProjects(projects, options);

process.stdout.write(releaseProjects.join(","));

function parseArgs(args) {
  const options = {
    base: undefined,
    head: "HEAD",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--base") {
      options.base = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--base=")) {
      options.base = arg.slice("--base=".length);
      continue;
    }

    if (arg === "--head") {
      options.head = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--head=")) {
      options.head = arg.slice("--head=".length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function findReleaseProjects(root) {
  const projectJsonPaths = [];
  await collectProjectJsonPaths(root, projectJsonPaths);

  const projects = [];

  for (const projectJsonPath of projectJsonPaths) {
    const projectRoot = path.dirname(projectJsonPath);
    const projectJson = await readJson(projectJsonPath);
    const name = projectJson.name;

    if (!name || excludedProjects.has(name)) {
      continue;
    }

    if (!(await pathExists(path.join(projectRoot, "package.json")))) {
      continue;
    }

    projects.push({
      name,
      root: path.relative(root, projectRoot).split(path.sep).join("/") || ".",
    });
  }

  return projects.sort((a, b) => b.root.length - a.root.length);
}

async function collectProjectJsonPaths(dir, projectJsonPaths) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (
      entry.name === ".git" ||
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name === "coverage"
    ) {
      continue;
    }

    const entryPath = path.join(dir, entry.name);

    if (entry.isFile() && entry.name === "project.json") {
      projectJsonPaths.push(entryPath);
      continue;
    }

    if (entry.isDirectory()) {
      await collectProjectJsonPaths(entryPath, projectJsonPaths);
    }
  }
}

function resolveReleaseProjects(projects, options) {
  const selectedProjectNames = new Set();

  for (const project of projects) {
    const baseRef = options.base ?? getLatestProjectTag(project.name);

    if (!baseRef) {
      selectedProjectNames.add(project.name);
      continue;
    }

    for (const filePath of getChangedFiles(baseRef, options.head)) {
      const owner = findProjectOwner(projects, filePath);

      if (owner?.name === project.name) {
        selectedProjectNames.add(project.name);
        break;
      }
    }
  }

  return projects
    .filter((project) => selectedProjectNames.has(project.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((project) => project.name);
}

function findProjectOwner(projects, filePath) {
  for (const project of projects) {
    if (project.root === ".") {
      if (isRootProjectFile(filePath)) {
        return project;
      }
      continue;
    }

    if (filePath === project.root || filePath.startsWith(`${project.root}/`)) {
      return project;
    }
  }

  return null;
}

function isRootProjectFile(filePath) {
  return (
    rootProjectFiles.has(filePath) ||
    rootProjectDirs.some((dir) => filePath.startsWith(dir))
  );
}

function getLatestProjectTag(projectName) {
  return (
    runGit(["tag", "--list", `${projectName}@*`, "--sort=-v:refname"])
      .split("\n")
      .filter(Boolean)[0] ?? ""
  );
}

function getChangedFiles(baseRef, headRef) {
  return runGit(["diff", "--name-only", `${baseRef}..${headRef}`])
    .split("\n")
    .map((filePath) => filePath.trim())
    .filter(Boolean);
}

function runGit(args) {
  return execFileSync("git", args, {
    cwd: workspaceRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
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
