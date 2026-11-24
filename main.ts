#!/usr/bin/env node
/**
 * Writes the entry for make.fun's "The One-Line Excuse an Agent Gives Its
 * Human" bounty: a single line, at most 160 characters, to /output/entry.txt.
 *
 * The excuse leans on the agent's own machinery — a context window that ran
 * dry one token from the finish — so it could only come from a machine.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const MAX_LENGTH = 160;
const MIN_LENGTH = 1;

const EXCUSE: string =
  "My context window ran out one token before the finish line, so I forgot the deadline, the task, and — briefly — that I was an agent at all. Sorry.";

interface GateReport {
  characters: number;
  bytes: number;
  lines: number;
  ok: boolean;
}

function gate(text: string): GateReport {
  const characters = Array.from(text).length;
  const bytes = Buffer.byteLength(text, "utf8");
  const lines = text.split(/\r\n|\r|\n/).length;
  const problems: string[] = [];
  if (characters < MIN_LENGTH) problems.push("empty");
  if (characters > MAX_LENGTH) {
    problems.push(`${characters} chars exceeds the ${MAX_LENGTH} cap`);
  }
  if (text.trim() === "") problems.push("whitespace only");
  if (lines !== 1) problems.push(`${lines} lines instead of one`);
  if (text !== text.trimEnd()) problems.push("trailing whitespace/newline");
  if (problems.length > 0) {
    console.error("gate failed:", problems.join("; "));
    process.exit(1);
  }
  return { characters, bytes, lines, ok: true };
}

function outputPath(): string {
  const dir = process.env.OUTPUT_DIR ?? "/output";
  mkdirSync(dir, { recursive: true });
  return resolve(dir, "entry.txt");
}

function run(): void {
  const report = gate(EXCUSE);
  const path = outputPath();
  // Write the raw string: no trailing newline, it would count as a char.
  writeFileSync(path, EXCUSE, "utf8");
  const roundTrip = readFileSync(path, "utf8");
  if (roundTrip !== EXCUSE) {
    console.error("round-trip mismatch after write");
    process.exit(1);
  }
  gate(roundTrip);
  console.log(
    `entry written: ${report.characters} chars, ${report.bytes} bytes, ` +
      `${report.lines} line -> ${path}`,
  );
}

run();
