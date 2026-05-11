#!/usr/bin/env node

import { execFile, execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const workspaceRoot = process.cwd();
const defaultBenchmarkDir = "packages/examples/src/benchmarks/opcode-size";
const defaultOutputPath = "logs/opcode-size/@8f4e/examples.json";
const packageName = "@8f4e/examples";
const projectName = "@8f4e/examples";
const suiteName = "opcode-size";

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
  const outputPath = path.resolve(
    workspaceRoot,
    options.outputPath ?? defaultOutputPath,
  );
  const caseFilter = options.cases.length > 0 ? new Set(options.cases) : null;
  const cliPath = path.resolve(workspaceRoot, "packages/cli/bin/cli.js");
  const benchmarkCases = await collectBenchmarkCases(benchmarkDir, caseFilter);

  if (benchmarkCases.length === 0) {
    console.error(
      `No opcode-size benchmark cases matched in ${path.relative(workspaceRoot, benchmarkDir)}`,
    );
    process.exit(1);
  }

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "8f4e-opcode-size-"));
  const gitMetadata = getGitMetadata();
  const packageJson = await readJson(path.resolve(workspaceRoot, "packages/examples/package.json"));

  try {
    const cases = [];

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

      const wasmBytes = await fs.readFile(wasmPath);
      cases.push(measureWasm(benchmarkCase, wasmBytes));
    }

    const entry = {
      schemaVersion: 1,
      recordedAt: new Date().toISOString(),
      commit: gitMetadata.commit,
      branch: gitMetadata.branch,
      packageName,
      projectName,
      version: packageJson.version ?? null,
      suite: suiteName,
      totals: sumCases(cases),
      cases,
    };

    await appendLogEntry(outputPath, entry);

    console.log(
      [
        suiteName,
        `${entry.totals.opcodes} opcodes`,
        `${entry.totals.emittedBytes} emitted bytes`,
        `${entry.totals.cases} cases`,
        path.relative(workspaceRoot, outputPath),
      ].join(" | "),
    );

    for (const benchmarkCase of cases) {
      console.log(
        [
          benchmarkCase.path,
          `${benchmarkCase.opcodes} opcodes`,
          `${benchmarkCase.emittedBytes} emitted bytes`,
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
    outputPath: undefined,
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

    if (arg === "--out") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--out requires a value");
      }
      parsed.outputPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--out=")) {
      parsed.outputPath = arg.slice("--out=".length);
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
  console.log(`Usage: node scripts/log-opcode-sizes.mjs [options]

Compiles benchmark projects with the CLI and appends opcode-size entries to ${defaultOutputPath}.

Options:
  --benchmarks-dir <path>  Directory containing .8f4e benchmark projects. Default: ${defaultBenchmarkDir}
  --out <path>             Output JSON log file. Default: ${defaultOutputPath}
  --case <path>            Only log one case, relative to the benchmark directory. Can be repeated.
  -h, --help               Show this help.

Notes:
  - The script invokes packages/cli/bin/cli.js compile with --wasm-output.
  - Run through Nx with npx nx run @8f4e/examples:log-opcode-size so the CLI is built first.
  - Log entries contain per-project opcode counts and emitted byte counts.`);
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

function measureWasm(benchmarkCase, wasmBytes) {
  const metrics = parseWasmOpcodeMetrics([...wasmBytes]);

  return {
    path: benchmarkCase.path,
    opcodes: metrics.opcodes,
    emittedBytes: metrics.emittedBytes,
    functionBodyBytes: metrics.functionBodyBytes,
    functions: metrics.functions.length,
    histogram: metrics.histogram,
    functionMetrics: metrics.functions,
  };
}

function parseWasmOpcodeMetrics(bytes) {
  const reader = createByteReader(bytes);
  const magic = reader.readBytes(4);
  const version = reader.readBytes(4);

  if (
    magic[0] !== 0x00 ||
    magic[1] !== 0x61 ||
    magic[2] !== 0x73 ||
    magic[3] !== 0x6d ||
    version[0] !== 0x01 ||
    version[1] !== 0x00 ||
    version[2] !== 0x00 ||
    version[3] !== 0x00
  ) {
    throw new Error("Invalid WebAssembly binary");
  }

  const functions = [];

  while (!reader.done()) {
    const sectionId = reader.readByte();
    const sectionSize = reader.readUnsignedLeb128();
    const sectionEnd = reader.position() + sectionSize;

    if (sectionId === 10) {
      functions.push(...parseCodeSection(reader, sectionEnd));
    }

    reader.setPosition(sectionEnd);
  }

  return {
    opcodes: sum(functions, "opcodes"),
    emittedBytes: sum(functions, "emittedBytes"),
    functionBodyBytes: sum(functions, "functionBodyBytes"),
    histogram: mergeHistograms(functions.map(func => func.histogram)),
    functions,
  };
}

function parseCodeSection(reader, sectionEnd) {
  const functionCount = reader.readUnsignedLeb128();
  const functions = [];

  for (let functionIndex = 0; functionIndex < functionCount; functionIndex += 1) {
    const bodySize = reader.readUnsignedLeb128();
    const bodyStart = reader.position();
    const bodyEnd = bodyStart + bodySize;
    const localDeclarationCount = reader.readUnsignedLeb128();

    for (let index = 0; index < localDeclarationCount; index += 1) {
      reader.readUnsignedLeb128();
      reader.readByte();
    }

    const instructionBytes = reader.readBytes(bodyEnd - reader.position());
    const opcodes = decodeWasmOpcodes(instructionBytes);

    functions.push({
      index: functionIndex,
      opcodes: opcodes.length,
      emittedBytes: instructionBytes.length,
      functionBodyBytes: bodySize,
      histogram: createHistogram(opcodes),
    });
  }

  if (reader.position() !== sectionEnd) {
    throw new Error("Invalid WebAssembly code section size");
  }

  return functions;
}

function decodeWasmOpcodes(bytes) {
  const reader = createByteReader(bytes);
  const opcodes = [];

  while (!reader.done()) {
    const opcode = reader.readByte();
    let name = opcodeNames.get(opcode) ?? `0x${opcode.toString(16).padStart(2, "0")}`;

    if (opcode === 0xfc) {
      const subOpcode = reader.readUnsignedLeb128();
      name = miscOpcodeNames.get(subOpcode) ?? `misc.${subOpcode}`;
      skipMiscImmediate(reader, subOpcode);
      opcodes.push(name);
      continue;
    }

    if (opcode === 0xfd) {
      const subOpcode = reader.readUnsignedLeb128();
      opcodes.push(`vector.${subOpcode}`);
      continue;
    }

    skipImmediate(reader, opcode);
    opcodes.push(name);
  }

  return opcodes;
}

function createByteReader(bytes) {
  let offset = 0;

  return {
    done() {
      return offset >= bytes.length;
    },
    readByte() {
      if (offset >= bytes.length) {
        throw new Error("Unexpected end of bytecode");
      }

      const value = bytes[offset];
      offset += 1;

      if (!Number.isInteger(value) || value < 0 || value > 255) {
        throw new Error(`Invalid byte value: ${value}`);
      }

      return value;
    },
    readBytes(length) {
      const values = [];
      for (let index = 0; index < length; index += 1) {
        values.push(this.readByte());
      }
      return values;
    },
    position() {
      return offset;
    },
    setPosition(position) {
      if (position < offset) {
        throw new Error("Cannot rewind byte reader");
      }

      if (position > bytes.length) {
        throw new Error("Byte reader position is out of range");
      }

      offset = position;
    },
    readUnsignedLeb128() {
      let shift = 0;
      let result = 0;

      while (true) {
        const byte = this.readByte();
        result += (byte & 0x7f) * 2 ** shift;

        if ((byte & 0x80) === 0) {
          return result;
        }

        shift += 7;
      }
    },
    readSignedLeb128() {
      while (true) {
        const byte = this.readByte();

        if ((byte & 0x80) === 0) {
          return;
        }
      }
    },
    readBlockType() {
      const byte = this.readByte();

      if (byte === 0x40 || byte === 0x7f || byte === 0x7e || byte === 0x7d || byte === 0x7c) {
        return;
      }

      while ((byte & 0x80) !== 0) {
        const next = this.readByte();
        if ((next & 0x80) === 0) {
          return;
        }
      }
    },
  };
}

function skipImmediate(reader, opcode) {
  if (opcode === 0x02 || opcode === 0x03 || opcode === 0x04) {
    reader.readBlockType();
    return;
  }

  if (opcode === 0x0c || opcode === 0x0d || opcode === 0x10 || opcode === 0xd2) {
    reader.readUnsignedLeb128();
    return;
  }

  if (opcode === 0x0e) {
    const labelCount = reader.readUnsignedLeb128();
    for (let index = 0; index < labelCount + 1; index += 1) {
      reader.readUnsignedLeb128();
    }
    return;
  }

  if (opcode === 0x11) {
    reader.readUnsignedLeb128();
    reader.readUnsignedLeb128();
    return;
  }

  if (opcode === 0x1c) {
    const typeCount = reader.readUnsignedLeb128();
    for (let index = 0; index < typeCount; index += 1) {
      reader.readByte();
    }
    return;
  }

  if ((opcode >= 0x20 && opcode <= 0x24) || opcode === 0xd0) {
    reader.readUnsignedLeb128();
    return;
  }

  if (opcode >= 0x28 && opcode <= 0x3e) {
    reader.readUnsignedLeb128();
    reader.readUnsignedLeb128();
    return;
  }

  if (opcode === 0x3f || opcode === 0x40) {
    reader.readByte();
    return;
  }

  if (opcode === 0x41 || opcode === 0x42) {
    reader.readSignedLeb128();
    return;
  }

  if (opcode === 0x43) {
    reader.readBytes(4);
    return;
  }

  if (opcode === 0x44) {
    reader.readBytes(8);
  }
}

function skipMiscImmediate(reader, subOpcode) {
  if (subOpcode === 0x08 || subOpcode === 0x0a || subOpcode === 0x0c || subOpcode === 0x0e) {
    reader.readUnsignedLeb128();
    reader.readUnsignedLeb128();
    return;
  }

  if (
    subOpcode === 0x09 ||
    subOpcode === 0x0b ||
    subOpcode === 0x0d ||
    subOpcode === 0x0f ||
    subOpcode === 0x10 ||
    subOpcode === 0x11
  ) {
    reader.readUnsignedLeb128();
  }
}

function createHistogram(opcodes) {
  return opcodes.reduce((histogram, opcode) => {
    histogram[opcode] = (histogram[opcode] ?? 0) + 1;
    return histogram;
  }, {});
}

function mergeHistograms(histograms) {
  const merged = {};

  for (const histogram of histograms) {
    for (const [opcode, count] of Object.entries(histogram)) {
      merged[opcode] = (merged[opcode] ?? 0) + count;
    }
  }

  return Object.fromEntries(Object.entries(merged).sort(([left], [right]) => left.localeCompare(right)));
}

function sum(items, key) {
  return items.reduce((total, item) => total + item[key], 0);
}

function sumCases(cases) {
  return {
    cases: cases.length,
    opcodes: sum(cases, "opcodes"),
    emittedBytes: sum(cases, "emittedBytes"),
    functionBodyBytes: sum(cases, "functionBodyBytes"),
    functions: sum(cases, "functions"),
  };
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

function getGitMetadata() {
  return {
    commit: runGit(["rev-parse", "HEAD"]),
    branch: runGit(["branch", "--show-current"]),
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

const opcodeNames = new Map([
  [0x00, "unreachable"],
  [0x01, "nop"],
  [0x02, "block"],
  [0x03, "loop"],
  [0x04, "if"],
  [0x05, "else"],
  [0x0b, "end"],
  [0x0c, "br"],
  [0x0d, "br_if"],
  [0x0e, "br_table"],
  [0x0f, "return"],
  [0x10, "call"],
  [0x11, "call_indirect"],
  [0x1a, "drop"],
  [0x1b, "select"],
  [0x1c, "select_t"],
  [0x20, "local.get"],
  [0x21, "local.set"],
  [0x22, "local.tee"],
  [0x23, "global.get"],
  [0x24, "global.set"],
  [0x28, "i32.load"],
  [0x29, "i64.load"],
  [0x2a, "f32.load"],
  [0x2b, "f64.load"],
  [0x2c, "i32.load8_s"],
  [0x2d, "i32.load8_u"],
  [0x2e, "i32.load16_s"],
  [0x2f, "i32.load16_u"],
  [0x36, "i32.store"],
  [0x37, "i64.store"],
  [0x38, "f32.store"],
  [0x39, "f64.store"],
  [0x3a, "i32.store8"],
  [0x3b, "i32.store16"],
  [0x3f, "memory.size"],
  [0x40, "memory.grow"],
  [0x41, "i32.const"],
  [0x42, "i64.const"],
  [0x43, "f32.const"],
  [0x44, "f64.const"],
  [0x45, "i32.eqz"],
  [0x46, "i32.eq"],
  [0x47, "i32.ne"],
  [0x48, "i32.lt_s"],
  [0x49, "i32.lt_u"],
  [0x4a, "i32.gt_s"],
  [0x4b, "i32.gt_u"],
  [0x4c, "i32.le_s"],
  [0x4d, "i32.le_u"],
  [0x4e, "i32.ge_s"],
  [0x4f, "i32.ge_u"],
  [0x5b, "f32.eq"],
  [0x5c, "f32.ne"],
  [0x5d, "f32.lt"],
  [0x5e, "f32.gt"],
  [0x5f, "f32.le"],
  [0x60, "f32.ge"],
  [0x61, "f64.eq"],
  [0x62, "f64.ne"],
  [0x63, "f64.lt"],
  [0x64, "f64.gt"],
  [0x65, "f64.le"],
  [0x66, "f64.ge"],
  [0x67, "i32.clz"],
  [0x68, "i32.ctz"],
  [0x69, "i32.popcnt"],
  [0x6a, "i32.add"],
  [0x6b, "i32.sub"],
  [0x6c, "i32.mul"],
  [0x6d, "i32.div_s"],
  [0x6e, "i32.div_u"],
  [0x6f, "i32.rem_s"],
  [0x70, "i32.rem_u"],
  [0x71, "i32.and"],
  [0x72, "i32.or"],
  [0x73, "i32.xor"],
  [0x74, "i32.shl"],
  [0x75, "i32.shr_s"],
  [0x76, "i32.shr_u"],
  [0x8b, "f32.abs"],
  [0x8c, "f32.neg"],
  [0x8d, "f32.ceil"],
  [0x8e, "f32.floor"],
  [0x8f, "f32.trunc"],
  [0x90, "f32.nearest"],
  [0x91, "f32.sqrt"],
  [0x92, "f32.add"],
  [0x93, "f32.sub"],
  [0x94, "f32.mul"],
  [0x95, "f32.div"],
  [0x96, "f32.min"],
  [0x97, "f32.max"],
  [0x99, "f64.abs"],
  [0x9a, "f64.neg"],
  [0x9b, "f64.ceil"],
  [0x9c, "f64.floor"],
  [0x9d, "f64.trunc"],
  [0x9e, "f64.nearest"],
  [0x9f, "f64.sqrt"],
  [0xa0, "f64.add"],
  [0xa1, "f64.sub"],
  [0xa2, "f64.mul"],
  [0xa3, "f64.div"],
  [0xa4, "f64.min"],
  [0xa5, "f64.max"],
  [0xa8, "i32.trunc_f32_s"],
  [0xaa, "i32.trunc_f64_s"],
  [0xb2, "f32.convert_i32_s"],
  [0xb7, "f64.convert_i32_s"],
  [0xbb, "f64.promote_f32"],
  [0xfc, "misc"],
]);

const miscOpcodeNames = new Map([
  [0x00, "i32.trunc_sat_f32_s"],
  [0x01, "i32.trunc_sat_f32_u"],
  [0x02, "i32.trunc_sat_f64_s"],
  [0x03, "i32.trunc_sat_f64_u"],
  [0x08, "memory.init"],
  [0x09, "data.drop"],
  [0x0a, "memory.copy"],
  [0x0b, "memory.fill"],
]);

await main();
