#!/usr/bin/env node

const fs = require('fs');

function symlinkApp() {
  if (!fs.existsSync('./node_modules/app')) {
    fs.symlinkSync('../app', './node_modules/app', 'dir');
  }
}

symlinkApp();
