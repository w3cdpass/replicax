#!/usr/bin/env node
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let nodeProcess = null;
let debounceTimeout = null;
const ENTRY_FILE = 'index.js';
const DEBOUNCE_DELAY = 300; // 3ms

// start the server

function startServer() {
    if (nodeProcess) nodeProcess.kill();

    nodeProcess = spawn('node', [ENTRY_FILE], {
        stdio: 'inherit'
    });
    console.log('[watch] server restarted\n');
}

// Recursively watch js files (excluding node_modules)
function watchDirectory(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name.startsWith('.')) return;
            watchDirectory(fullPath); // recurse
        } else if (entry.isFile() && fullPath.endsWith('.js')) {
            watchFile(fullPath)
        }
    });
}

function watchFile(filePath) {
    fs.watchFile(filePath, { interval: 100 }, () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            console.log(`[watch] changes detected: ${filePath}`);
            startServer();
        }, DEBOUNCE_DELAY);
    });
}

// watch
console.log('[watch] Watching project files..\n')
startServer();
watchDirectory(process.cwd())