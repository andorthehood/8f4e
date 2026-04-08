#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

function usage() {
  console.error(
    [
      "Usage:",
      "  node tools/import-bdf.mjs <bdf-path> <font-name> [--glyphs-from <existing-font>]",
      "",
      "Example:",
      "  node tools/import-bdf.mjs path/to/font.bdf myfont12x16 --glyphs-from ibmvga8x16",
    ].join("\n"),
  );
  process.exit(1);
}

function parseArgs(argv) {
  if (argv.length < 2) {
    usage();
  }

  const [bdfPath, fontName, ...rest] = argv;
  let glyphsFrom = "ibmvga8x16";

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--glyphs-from") {
      glyphsFrom = rest[i + 1];
      i++;
    }
  }

  return {
    bdfPath: resolve(process.cwd(), bdfPath),
    fontName,
    glyphsFrom,
  };
}

function parseGlobalBbx(lines) {
  const bbxLine = lines.find((line) => line.startsWith("FONTBOUNDINGBOX "));
  if (!bbxLine) {
    throw new Error("FONTBOUNDINGBOX not found in BDF");
  }

  const [, width, height, xOffset, yOffset] =
    bbxLine.match(
      /^FONTBOUNDINGBOX\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)$/,
    ) || [];
  if (
    width === undefined ||
    height === undefined ||
    xOffset === undefined ||
    yOffset === undefined
  ) {
    throw new Error(`Invalid FONTBOUNDINGBOX line: ${bbxLine}`);
  }

  return {
    width: Number(width),
    height: Number(height),
  };
}

function parseFontVerticalMetrics(lines) {
  const ascentLine = lines.find((line) => line.startsWith("FONT_ASCENT "));
  const descentLine = lines.find((line) => line.startsWith("FONT_DESCENT "));
  if (!ascentLine || !descentLine) {
    throw new Error("FONT_ASCENT or FONT_DESCENT not found in BDF");
  }

  return {
    ascent: Number(ascentLine.slice("FONT_ASCENT ".length)),
    descent: Number(descentLine.slice("FONT_DESCENT ".length)),
  };
}

function hexRowToBinaryString(hex, width) {
  const bits = hex
    .split("")
    .map((char) => Number.parseInt(char, 16).toString(2).padStart(4, "0"))
    .join("");

  return bits.slice(0, width);
}

function placeGlyphOnCanvas(
  bitmapRows,
  glyphBbx,
  canvasWidth,
  canvasHeight,
  fontAscent,
) {
  const xOffset = glyphBbx.xOffset;
  const yOffset = fontAscent - (glyphBbx.height + glyphBbx.yOffset);
  const canvas = Array.from({ length: canvasHeight }, () =>
    Array.from({ length: canvasWidth }, () => " "),
  );

  for (let y = 0; y < glyphBbx.height; y++) {
    const row = bitmapRows[y] || "".padEnd(glyphBbx.width, "0");
    for (let x = 0; x < glyphBbx.width; x++) {
      const canvasX = x + xOffset;
      const canvasY = y + yOffset;
      if (
        canvasX < 0 ||
        canvasX >= canvasWidth ||
        canvasY < 0 ||
        canvasY >= canvasHeight
      ) {
        continue;
      }
      if (row[x] === "1") {
        canvas[canvasY][canvasX] = "#";
      }
    }
  }

  return canvas.map((row) => row.join(""));
}

function parseBdfGlyphs(source) {
  const lines = source.split(/\r?\n/);
  const globalBbx = parseGlobalBbx(lines);
  const verticalMetrics = parseFontVerticalMetrics(lines);
  const glyphs = new Map();

  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i] !== "STARTCHAR " + lines[i].slice(10) ||
      !lines[i].startsWith("STARTCHAR ")
    ) {
      continue;
    }

    let encoding = null;
    let bbx = null;
    let bitmapStart = -1;

    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.startsWith("ENCODING ")) {
        encoding = Number(line.slice("ENCODING ".length));
      } else if (line.startsWith("BBX ")) {
        const [, width, height, xOffset, yOffset] =
          line.match(/^BBX\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)$/) || [];
        if (
          width === undefined ||
          height === undefined ||
          xOffset === undefined ||
          yOffset === undefined
        ) {
          throw new Error(`Invalid BBX line: ${line}`);
        }
        bbx = {
          width: Number(width),
          height: Number(height),
          xOffset: Number(xOffset),
          yOffset: Number(yOffset),
        };
      } else if (line === "BITMAP") {
        bitmapStart = j + 1;
      } else if (line === "ENDCHAR") {
        if (
          encoding !== null &&
          encoding >= 0 &&
          encoding <= 127 &&
          bbx &&
          bitmapStart !== -1
        ) {
          const rawBitmapRows = lines.slice(
            bitmapStart,
            bitmapStart + bbx.height,
          );
          const bitmapRows = rawBitmapRows.map((row) =>
            hexRowToBinaryString(row, bbx.width),
          );
          glyphs.set(
            encoding,
            placeGlyphOnCanvas(
              bitmapRows,
              bbx,
              globalBbx.width,
              globalBbx.height,
              verticalMetrics.ascent,
            ),
          );
        }
        i = j;
        break;
      }
    }
  }

  return {
    width: globalBbx.width,
    height: globalBbx.height,
    glyphs,
  };
}

function formatGlyphArray(glyphs) {
  return `const glyphs = ${JSON.stringify(glyphs, null, "\t")};\n\nexport default glyphs;\n`;
}

async function loadGlyphModule(modulePath) {
  const moduleUrl = pathToFileURL(modulePath).href;
  const imported = await import(moduleUrl);
  if (!Array.isArray(imported.default)) {
    throw new Error(`Glyph module does not export a default glyph array: ${modulePath}`);
  }

  return imported.default;
}

function centerPadGlyphs(glyphs, targetWidth, targetHeight) {
  return glyphs.map((glyph) => {
    const sourceHeight = glyph.length;
    const sourceWidth = glyph[0]?.length ?? 0;
    const horizontalPadLeft = Math.floor((targetWidth - sourceWidth) / 2);
    const horizontalPadRight = targetWidth - sourceWidth - horizontalPadLeft;
    const verticalPadTop = Math.floor((targetHeight - sourceHeight) / 2);
    const verticalPadBottom = targetHeight - sourceHeight - verticalPadTop;
    const paddedRows = glyph.map(
      (row) =>
        " ".repeat(Math.max(0, horizontalPadLeft)) +
        row +
        " ".repeat(Math.max(0, horizontalPadRight)),
    );

    return [
      ...Array.from({ length: Math.max(0, verticalPadTop) }, () =>
        " ".repeat(targetWidth),
      ),
      ...paddedRows.map((row) =>
        row.slice(0, targetWidth).padEnd(targetWidth, " "),
      ),
      ...Array.from({ length: Math.max(0, verticalPadBottom) }, () =>
        " ".repeat(targetWidth),
      ),
    ].slice(0, targetHeight);
  });
}

async function main() {
  const { bdfPath, fontName, glyphsFrom } = parseArgs(process.argv.slice(2));
  const bdfSource = readFileSync(bdfPath, "utf-8");
  const { width, height, glyphs } = parseBdfGlyphs(bdfSource);
  const asciiGlyphs = Array.from(
    { length: 128 },
    (_, code) =>
      glyphs.get(code) ||
      Array.from({ length: height }, () => " ".repeat(width)),
  );

  const glyphSourcePath = join(
    projectRoot,
    "src",
    "fonts",
    glyphsFrom,
    "glyphs.ts",
  );
  const sourceGlyphs = await loadGlyphModule(glyphSourcePath);
  const paddedGlyphs = centerPadGlyphs(sourceGlyphs, width, height);

  const outputDir = join(projectRoot, "src", "fonts", fontName);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    join(outputDir, "ascii.ts"),
    formatGlyphArray(asciiGlyphs),
    "utf-8",
  );
  writeFileSync(
    join(outputDir, "glyphs.ts"),
    formatGlyphArray(paddedGlyphs),
    "utf-8",
  );

  console.log(`Created ${fontName} font sources in ${outputDir}`);
  console.log(`ASCII glyphs: 128 from ${bdfPath}`);
  console.log(`Custom glyphs: padded from ${glyphsFrom}`);
  console.log(`Dimensions: ${width}x${height}`);
}

await main();
