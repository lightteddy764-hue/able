/**
 * keep-alive.js — pings your Render URL on an interval so the free
 * instance doesn't go to sleep. Run this on your OWN machine (not on Render).
 *
 * Usage:
 *   node keep-alive.js
 *   node keep-alive.js https://your-other-url.onrender.com/
 *
 * Stop it anytime with Ctrl+C.
 */

const https = require('https');
const http = require('http');

// Target URL (CLI arg overrides the default)
const TARGET = process.argv[2] || 'https://able-wellness-platform.onrender.com/';

// Base interval: 14 minutes, plus up to 60s of random jitter each time
const BASE_MS = 14 * 60 * 1000;
const JITTER_MS = 60 * 1000;

let count = 0;

function ts() {
    return new Date().toLocaleTimeString();
}

function ping() {
    count++;
    const lib = TARGET.startsWith('https') ? https : http;
    const started = Date.now();

    const req = lib.get(TARGET, (res) => {
        // Drain the response so the socket frees up
        res.on('data', () => {});
        res.on('end', () => {
            const ms = Date.now() - started;
            console.log(`[${ts()}] #${count} ✓ ${res.statusCode} (${ms}ms) -> ${TARGET}`);
            scheduleNext();
        });
    });

    req.on('error', (err) => {
        console.log(`[${ts()}] #${count} ✗ ERROR: ${err.message}`);
        scheduleNext();
    });

    // Don't hang forever if the server is waking up
    req.setTimeout(60000, () => {
        req.destroy();
        console.log(`[${ts()}] #${count} timeout (server may be waking up)`);
    });
}

function scheduleNext() {
    const delay = BASE_MS + Math.floor(Math.random() * JITTER_MS);
    const mins = (delay / 60000).toFixed(1);
    console.log(`           next ping in ~${mins} min`);
    setTimeout(ping, delay);
}

console.log('=================================================');
console.log(' Keep-Alive Pinger');
console.log(' Target :', TARGET);
console.log(' Every  : ~14 min (+ random jitter up to 60s)');
console.log(' Stop   : press Ctrl+C');
console.log('=================================================');

// Fire the first ping immediately
ping();

process.on('SIGINT', () => {
    console.log(`\n[${ts()}] Stopped after ${count} ping(s). Bye!`);
    process.exit(0);
});
