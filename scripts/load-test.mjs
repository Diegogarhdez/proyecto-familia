#!/usr/bin/env node

const DEFAULT_TARGET = process.env.TARGET_URL || 'http://localhost:3000/api/';
const MAX_REQUESTS = 500;
const MAX_CONCURRENCY = 50;
const MAX_DURATION_SECONDS = 60;

function readOption(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

function printHelp() {
  console.log(`
Prueba de rate limiting del backend

Uso:
  pnpm load-test [opciones]

Opciones:
  --target URL          URL a probar (por defecto: ${DEFAULT_TARGET})
  --requests N          Solicitudes totales, máximo ${MAX_REQUESTS} (por defecto: 260)
  --concurrency N       Solicitudes simultáneas, máximo ${MAX_CONCURRENCY} (por defecto: 20)
  --duration N           Duración máxima en segundos, máximo ${MAX_DURATION_SECONDS} (por defecto: 30)
  --allow-external       Permite probar una URL que no sea localhost
  --help                 Muestra esta ayuda
`);
}

if (process.argv.includes('--help')) {
  printHelp();
  process.exit(0);
}

const target = readOption('target', DEFAULT_TARGET);
const requests = Number(readOption('requests', 260));
const concurrency = Number(readOption('concurrency', 20));
const durationSeconds = Number(readOption('duration', 30));
const allowExternal = process.argv.includes('--allow-external');

let targetUrl;
try {
  targetUrl = new URL(target);
} catch {
  console.error('La URL indicada no es válida.');
  process.exit(1);
}

const isLocalTarget = ['localhost', '127.0.0.1', '::1'].includes(targetUrl.hostname);
if (!isLocalTarget && !allowExternal) {
  console.error('Por seguridad, el script solo permite localhost por defecto. Usa --allow-external únicamente con un servidor que controles.');
  process.exit(1);
}

if (!Number.isInteger(requests) || requests < 1 || requests > MAX_REQUESTS) {
  console.error(`--requests debe ser un entero entre 1 y ${MAX_REQUESTS}.`);
  process.exit(1);
}

if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > MAX_CONCURRENCY) {
  console.error(`--concurrency debe ser un entero entre 1 y ${MAX_CONCURRENCY}.`);
  process.exit(1);
}

if (!Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > MAX_DURATION_SECONDS) {
  console.error(`--duration debe ser un entero entre 1 y ${MAX_DURATION_SECONDS}.`);
  process.exit(1);
}

const startedAt = Date.now();
const deadline = startedAt + durationSeconds * 1000;
const statusCounts = new Map();
let completed = 0;
let accepted = 0;
let rejected = 0;
let failed = 0;
let nextRequest = 0;

function countStatus(status) {
  statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
}

async function sendRequest(requestNumber) {
  const requestStartedAt = Date.now();

  try {
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(5000) });
    countStatus(response.status);

    if (response.status === 429 || response.status === 403) {
      rejected += 1;
    } else if (response.ok) {
      accepted += 1;
    }

    if (requestNumber <= 10 || response.status === 429 || response.status === 403) {
      console.log(`#${requestNumber} ${response.status} (${Date.now() - requestStartedAt} ms)`);
    }
  } catch (error) {
    failed += 1;
    console.log(`#${requestNumber} error (${error instanceof Error ? error.message : String(error)})`);
  } finally {
    completed += 1;
  }
}

async function worker() {
  while (Date.now() < deadline) {
    const requestNumber = ++nextRequest;
    if (requestNumber > requests) return;
    await sendRequest(requestNumber);
  }
}

console.log(`Probando ${targetUrl.href}`);
console.log(`${requests} solicitudes, ${concurrency} concurrentes, máximo ${durationSeconds}s`);
console.log('Las primeras respuestas deberían ser correctas y, al superar los límites, aparecer 429.');

await Promise.all(Array.from({ length: concurrency }, () => worker()));

const elapsed = Date.now() - startedAt;
console.log('\nResumen');
console.log(`Completadas: ${completed}/${requests}`);
console.log(`Correctas: ${accepted}`);
console.log(`Rechazadas por protección (429/403): ${rejected}`);
console.log(`Errores de red/timeout: ${failed}`);
console.log(`Códigos: ${[...statusCounts].map(([status, count]) => `${status}: ${count}`).join(', ') || 'ninguno'}`);
console.log(`Tiempo: ${elapsed} ms`);

if (rejected === 0) {
  console.log('\nNo se detectaron rechazos. Revisa que el backend esté ejecutándose y que el rate limiting esté activo.');
  process.exitCode = 2;
}
