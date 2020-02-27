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

        buildModel(configName, stringModels);
    })
}

function buildModel(configFileName, stringModels) {
    const exportDir = fs.readdirSync(pr(exportPath));
    exportDir.forEach(languageDir => {
        const nlsFilePath = pr(exportPath, languageDir, configFileName);
        let nlsFileContent = {};
        try {
            const nlsFile = fs.readFileSync(nlsFilePath);
            nlsFileContent = JSON.parse(nlsFile);
        }
        catch (err) { }
        finally {
            stringModels.forEach(item => {
                if (!nlsFileContent[item]) nlsFileContent[item] = "";
            })
            const nlsJson = JSON.stringify(nlsFileContent, null, 4);
            fs.writeFileSync(nlsFilePath, nlsJson);
        }
    })
}

function pr(...args) {
    return path.resolve(...args);
}