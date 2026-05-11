#!/usr/bin/env node

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const workspaceRoot = process.cwd();
const defaultBenchmarkDir = "packages/examples/src/benchmarks/bytecode-size";
const defaultOutputDir = "logs/bytecode-size";
const suiteName = "bytecode-size";

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const benchmarkDir = path.resolve(
    workspaceRoot,
    options.benchmarkDir ?? defaultBenchmarkDir,
  );
  const outputDir = path.resolve(
    workspaceRoot,
    options.outputDir ?? defaultOutputDir,
  );
  const caseFilter = options.cases.length > 0 ? new Set(options.cases) : null;
  const cliPath = path.resolve(workspaceRoot, "packages/cli/bin/cli.js");
  const benchmarkCases = await collectBenchmarkCases(benchmarkDir, caseFilter);

  if (benchmarkCases.length === 0) {
    console.error(
      `No bytecode-size benchmark cases matched in ${path.relative(workspaceRoot, benchmarkDir)}`,
    );
    process.exit(1);
  }

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "8f4e-bytecode-size-"));
  try {
    const loggedCases = [];

    for (const benchmarkCase of benchmarkCases) {
      const wasmPath = path.join(tempRoot, `${benchmarkCase.slug}.wasm`);
      await execFileAsync(process.execPath, [
        cliPath,
        "compile",
        benchmarkCase.filePath,
        "--wasm-output",
        wasmPath,
      ], {
        cwd: workspaceRoot,
        maxBuffer: 1024 * 1024 * 20,
      });

      const emittedBytes = (await fs.stat(wasmPath)).size;
      const outputPath = getCaseLogPath(outputDir, benchmarkCase);
      const entry = {
        emittedBytes,
      };

      await appendLogEntry(outputPath, entry);
      loggedCases.push({
        ...entry,
        sourcePath: benchmarkCase.path,
        outputPath,
      });
    }

    const totals = sumCases(loggedCases);

    console.log(
      [
        suiteName,
        `${totals.emittedBytes} emitted bytes`,
        `${totals.cases} cases`,
        path.relative(workspaceRoot, outputDir),
      ].join(" | "),
    );

    for (const benchmarkCase of loggedCases) {
      console.log(
        [
          benchmarkCase.sourcePath,
          `${benchmarkCase.emittedBytes} emitted bytes`,
          path.relative(workspaceRoot, benchmarkCase.outputPath),
        ].join(" | "),
      );
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

function parseArgs(args) {
  const parsed = {
    help: false,
    benchmarkDir: undefined,
    outputDir: undefined,
    cases: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--benchmarks-dir") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--benchmarks-dir requires a value");
      }
      parsed.benchmarkDir = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--benchmarks-dir=")) {
      parsed.benchmarkDir = arg.slice("--benchmarks-dir=".length);
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

    if (arg === "--case") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--case requires a value");
      }
      parsed.cases.push(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--case=")) {
      parsed.cases.push(arg.slice("--case=".length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage: node scripts/log-bytecode-sizes.mjs [options]

Compiles benchmark projects with the CLI and appends bytecode-size entries to ${defaultOutputDir}/{benchmark-name}.json.

Options:
  --benchmarks-dir <path>  Directory containing .8f4e benchmark projects. Default: ${defaultBenchmarkDir}
  --out-dir <path>         Output directory for per-benchmark JSON logs. Default: ${defaultOutputDir}
  --case <path>            Only log one case, relative to the benchmark directory. Can be repeated.
  -h, --help               Show this help.

Notes:
  - The script invokes packages/cli/bin/cli.js compile with --wasm-output.
  - Run through Nx with npx nx run @8f4e/examples:log-bytecode-size so the CLI is built first.
  - Log entries contain emitted byte counts.`);
}

async function collectBenchmarkCases(root, caseFilter) {
  const files = [];
  await collectFiles(root, root, files);

  return files
    .filter(({ relativePath }) => !caseFilter || caseFilter.has(relativePath))
    .map(({ filePath, relativePath }) => ({
      filePath,
      path: path.relative(workspaceRoot, filePath).split(path.sep).join("/"),
      relativePath,
      slug: relativePath.replace(/\.8f4e$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-"),
      logName: `${path.basename(relativePath, ".8f4e")}.json`,
    }))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function collectFiles(root, dir, files) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await collectFiles(root, entryPath, files);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".8f4e")) {
      continue;
    }

    files.push({
      filePath: entryPath,
      relativePath: path.relative(root, entryPath).split(path.sep).join("/"),
    });
  }
}

function sum(items, key) {
  return items.reduce((total, item) => total + item[key], 0);
}

function sumCases(cases) {
  return {
    cases: cases.length,
    emittedBytes: sum(cases, "emittedBytes"),
  };
}

function getCaseLogPath(outputDir, benchmarkCase) {
  return path.join(outputDir, benchmarkCase.logName);
}

async function appendLogEntry(filePath, entry) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const existingEntries = (await pathExists(filePath))
    ? await readJson(filePath)
    : [];

  if (!Array.isArray(existingEntries)) {
    throw new Error(`${path.relative(workspaceRoot, filePath)} must contain a JSON array`);
  }

  existingEntries.push(entry);
  await fs.writeFile(filePath, `${JSON.stringify(existingEntries, null, "\t")}\n`);
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

await main();
