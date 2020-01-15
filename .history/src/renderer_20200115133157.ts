import './index.css';
import fs = require('fs');
import path = require('path');

console.log('👋 This message is being logged by "renderer.js", included via webpack');

const dir = path.resolve('./');
console.log(fs.readdirSync(dir));