#!/usr/bin/env node
/* ==========================================================================
   RevHops — local preview server

   Links between pages are root-absolute and extensionless (`/services`,
   `/case-studies/case-study-one`), because that is what the address bar
   should show in production. From `file://` those resolve against the
   filesystem root and go nowhere, which is why clicking around a page opened
   by double-clicking it does not work.

   This is the fix, and it is the one the README has always pointed at: a
   static server that resolves a bare path the way GitHub Pages does.

       node tools/serve.js            → http://localhost:8000
       node tools/serve.js 4000       → a different port

   Zero dependencies, Node's own http and fs. It is a preview server and
   nothing more: no caching, no compression, no https, and it binds to every
   interface on purpose so a phone on the same Wi-Fi can reach it too.

   Resolution order for a request path, matching GitHub Pages:

       /services        → services.html, then services/index.html
       /services/       → services/index.html
       /pricing         → pricing.html
       /assets/css/…    → the file itself

   Anything it cannot resolve gets a plain 404 rather than a fallback to the
   homepage, because silently serving index.html for a typo is how a broken
   link survives a click-through test.
   ========================================================================== */

'use strict';

var http = require('http');
var fs   = require('fs');
var path = require('path');
var url  = require('url');

var ROOT = path.resolve(__dirname, '..');
var PORT = parseInt(process.argv[2], 10) || 8000;

var TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

/* Everything served has to sit inside ROOT. A request path is attacker-
   controlled in principle even on localhost, and `..` in one would otherwise
   walk straight out of the folder. */
function resolveSafely(rel) {
  var full = path.resolve(ROOT, '.' + path.posix.normalize('/' + rel));
  return full === ROOT || full.indexOf(ROOT + path.sep) === 0 ? full : null;
}

function firstFile(candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var c = candidates[i];
    if (!c) continue;
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch (e) { /* not there, try the next one */ }
  }
  return null;
}

http.createServer(function (req, res) {
  var pathname = decodeURIComponent(url.parse(req.url).pathname);
  var base = resolveSafely(pathname);

  if (!base) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 outside the site folder\n');
  }

  var file = firstFile([
    /\/$/.test(pathname) ? null : base,          /* the exact file */
    /\/$/.test(pathname) ? null : base + '.html', /* /pricing → pricing.html */
    path.join(base, 'index.html')                 /* /services → services/index.html */
  ]);

  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<h1>404</h1><p>Nothing at <code>' + pathname.replace(/</g, '&lt;') +
                   '</code>.</p><p><a href="/">Back to the homepage</a></p>');
  }

  var body = fs.readFileSync(file);
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': body.length,
    /* a preview server that caches is a preview server that lies */
    'Cache-Control': 'no-store'
  });
  res.end(body);
}).listen(PORT, function () {
  console.log('\n  RevHops preview running.\n');
  console.log('    http://localhost:' + PORT + '\n');
  console.log('  Links between pages work here and do not from file://.');
  console.log('  Stop it with Control-C, or just close this window.\n');
});
