const fs = require('fs');
const path = require('path');

const configurationPath = './src/configuration/default';
const exportPath = './src/common/constant/config.constant.ts';

autoBuildConstantFile();

function autoBuildConstantFile() {
    let constantContent = '';

    const configsName = fs.readdirSync(pr(configurationPath));
    configsName.forEach((configName) => {
        if (!fs.statSync(pr(configurationPath, configName)).isFile) return;

        const configFile = fs.readFileSync(pr(configurationPath, configName));
        const config = JSON.parse(configFile);
        const keys = Object.keys(config.properties);

        constantContent += buildConstant(constantContent, configName, keys);
    })
    fs.writeFileSync(pr(exportPath), constantContent)
    console.log(`build constant file success, read ${exportPath}`);
}

function buildConstant(content, configName, keys) {
    let newContent = `export const ${configName.slice(0, -5)}Config = {`
    const prefix = '\r\n';

    keys.forEach((key) => {
        keyConstantName = key.slice(configName.length - 5 + 1).replace('.', '_').toUpperCase();
        newContent += `${prefix}    ${keyConstantName}: '${key}',`;
    })
    newContent = newContent.slice(0, -1)
    newContent += '\r\n};\r\n\r\n'
    return newContent;
}

function pr(...args) {
    return path.resolve(...args);
}