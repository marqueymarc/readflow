const workerModule = await import('./worker.js');
const worker = workerModule.default;

if (!worker || typeof worker.fetch !== 'function') {
  console.error('UI check failed: unable to import worker fetch handler');
  process.exit(1);
}

const response = await worker.fetch(new Request('https://example.com/'), {});
const html = await response.text();
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('UI check failed: unable to find rendered <script> block');
  process.exit(1);
}

try {
  // Parse-only syntax validation for rendered browser script.
  // eslint-disable-next-line no-new, no-new-func
  new Function(scriptMatch[1]);
} catch (error) {
  console.error('UI check failed: rendered browser script has a syntax error');
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}

console.log('UI check passed: rendered browser script is syntactically valid.');
