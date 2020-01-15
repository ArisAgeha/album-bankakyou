import './index.css';
import fs = require('fs');

console.log('👋 This message is being logged by "renderer.js", included via webpack');
console.log(fs.readFileSync('./'));
