const fs = require('fs');
const path = require('path');

const from = pr('src/configuration');
const to = pr('out/project-r-win32-x64/resources/app/configuration')
const rootDirName = 'configuration'

copyDir(from, to);

function copyDir(from, to){
    fs.mkdirSync(to);

    const fromDirs = fs.readdirSync(from);
    fromDirs.forEach((dirOrFileName) => {
        const newFrom = pr(from, dirOrFileName);
        const newTo = pr(to, dirOrFileName);

        if (fs.statSync(newFrom).isDirectory()) {
            copyDir(newFrom, newTo);
        }
        else {
            fs.copyFileSync(newFrom, newTo);
        }
    })
}

function pr(...args) {
    return path.resolve(...args);
}