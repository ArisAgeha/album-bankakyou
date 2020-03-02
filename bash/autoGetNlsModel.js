const fs = require('fs');
const path = require('path');

const configurationPath = './src/configuration/default';
const exportPath = './src/languages';

autoGetNlsModel();

function autoGetNlsModel() {
    const configsName = fs.readdirSync(pr(configurationPath));
    configsName.forEach((configName) => {
        const configFile = fs.readFileSync(pr(configurationPath, configName));
        const config = JSON.stringify(JSON.parse(configFile));
        const stringModels = config.match(/\%.+?\%/g);
        if (!stringModels) return;

        buildModel(configName, stringModels);
    })
}

function buildModel(configFileName, stringModels) {
    const exportDir = fs.readdirSync(pr(exportPath));
    exportDir.forEach(languageDir => {
        if (!fs.statSync(pr(exportPath, languageDir)).isDirectory()) return;

        const nlsFilePath = pr(exportPath, languageDir, configFileName);
        let nlsFileContent = {};
        if (!fs.existsSync(nlsFilePath)) fs.writeFileSync(nlsFilePath, '{}');

        const nlsFile = fs.readFileSync(nlsFilePath);
        nlsFileContent = JSON.parse(nlsFile);
        stringModels.forEach(item => {
            if (!nlsFileContent[item]) nlsFileContent[item] = "";
        })
        const nlsJson = JSON.stringify(nlsFileContent, null, 4);
        fs.writeFileSync(nlsFilePath, nlsJson);
        console.log(`build/update [${nlsFilePath}] model success...`);
    })
}

function pr(...args) {
    return path.resolve(...args);
}