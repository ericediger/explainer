#!/usr/bin/env node
/**
 * Find (or install) the SIZZLE engine for the /sizzle skill.
 *
 *   node engine.mjs                 print the engine folder; exit 1 with where it looked when there is none
 *   node engine.mjs --install       clone it to $SIZZLE_HOME or ~/.sizzle, install packages and browsers
 *   node engine.mjs --install --dir=<path>   ... into <path> instead
 *   node engine.mjs --setup         install packages and browsers in the engine that was found
 *   node engine.mjs --update        pull the latest engine, then the same as --setup
 *
 * Looks in order: $SIZZLE_HOME, a SIZZLE, sizzle or EXPLAINER folder next to the current folder or any folder
 * above it (the engine's own layout: it sits beside the apps it films), the current folder if it is inside the
 * engine, then ~/.sizzle. No dependencies: runs on the Node the engine needs anyway.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = 'https://github.com/ericediger/sizzle.git';
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const has = (name) => args.includes(`--${name}`);
const home = () => process.env.SIZZLE_HOME || path.join(os.homedir(), '.sizzle');
/** Folder names the engine goes by next to the apps; EXPLAINER is its name from before it was SIZZLE. */
const SIBLINGS = ['SIZZLE', 'sizzle', 'EXPLAINER'];

/** An engine folder: package.json named "sizzle" (or "explainer", its old name) with the pipeline's build script next to it. */
function isEngine(dir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    return ['sizzle', 'explainer'].includes(pkg.name) && fs.existsSync(path.join(dir, 'scripts', 'build.ts'));
  } catch {
    return false;
  }
}

function candidates() {
  const out = [];
  if (process.env.SIZZLE_HOME) out.push(process.env.SIZZLE_HOME);
  for (let d = process.cwd(); ; d = path.dirname(d)) {
    for (const name of SIBLINGS) out.push(path.join(path.dirname(d), name));
    out.push(d);
    if (path.dirname(d) === d) break;
  }
  out.push(path.join(os.homedir(), '.sizzle'));
  return [...new Set(out.map((p) => path.resolve(p)))];
}

function find() {
  return candidates().find(isEngine) ?? null;
}

function run(cmd, cmdArgs, cwd) {
  console.error(`$ ${[cmd, ...cmdArgs].join(' ')}`);
  execFileSync(cmd, cmdArgs, { cwd, stdio: ['ignore', 'inherit', 'inherit'], shell: process.platform === 'win32' });
}

/** Packages, Playwright's Chromium + ffmpeg (recording), Remotion's headless Chrome (rendering). */
function installPackages(dir) {
  run('npm', ['ci', '--no-audit', '--no-fund'], dir);
  run('npx', ['playwright', 'install', 'chromium', 'ffmpeg'], dir);
  run('npx', ['remotion', 'browser', 'ensure'], dir);
}

function status(dir) {
  const ready = fs.existsSync(path.join(dir, 'node_modules', '.bin', 'remotion'));
  console.log(dir);
  if (!ready) console.error(`(packages not installed yet: run  node ${process.argv[1]} --setup)`);
}

const major = Number(process.versions.node.split('.')[0]);
if (major < 20) {
  console.error(`The engine needs Node 20 or newer; this is Node ${process.versions.node}.`);
  process.exit(1);
}

if (has('install')) {
  const found = find();
  if (found && !flag('dir')) {
    console.error(`Engine already present at ${found}`);
    status(found);
    process.exit(0);
  }
  const dir = path.resolve(flag('dir') ?? home());
  if (fs.existsSync(dir) && fs.readdirSync(dir).length) {
    console.error(`${dir} exists and is not empty; pick another --dir or remove it.`);
    process.exit(1);
  }
  run('git', ['clone', '--depth', '1', REPO, dir]);
  installPackages(dir);
  console.error(`\nEngine ready. Narration keys go in ${path.join(dir, '.env')} (copy .env.example).`);
  console.log(dir);
} else if (has('update') || has('setup')) {
  const dir = find();
  if (!dir) {
    console.error('No engine found; run with --install.');
    process.exit(1);
  }
  if (has('update') && fs.existsSync(path.join(dir, '.git'))) run('git', ['pull', '--ff-only'], dir);
  installPackages(dir);
  console.log(dir);
} else {
  const dir = find();
  if (dir) {
    status(dir);
  } else {
    console.error('No SIZZLE engine found. Looked in:');
    for (const c of candidates()) console.error(`  ${c}`);
    console.error(`Install it with: node ${process.argv[1]} --install   (clones ${REPO} to ${home()})`);
    process.exit(1);
  }
}
