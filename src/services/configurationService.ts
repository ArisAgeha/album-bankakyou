import { injectable } from '@/common/injectable';
import { FileService } from './fileService';
import { isObject, getTypeof } from '@/common/types';
import { LogService } from './logService';

@injectable
export class ConfigurationService {
    constructor(private readonly fileService: FileService, private readonly logService: LogService) {}

    private _config: IConfig = {};
    private readonly defaultConfigDir: string = '../configuration/default';
    private readonly userConfigDir: string = '../configuration/user';

    initial(): void {
        this.loadDefaultConfigs();
        this.loadUserConfigs();
    }

    loadDefaultConfigs(): void {
        const config: IConfig = {};
        const dirInfo: string[] = this.fileService.getDirInfoSync(this.defaultConfigDir);
        dirInfo.forEach((filename: string) => {
            const fileContent: IDefaultConfigItem = this.fileService.loadJsonSync(this.defaultConfigDir, filename);
            config[fileContent.id] = fileContent.properties;
        });
        this._config = config;
    }

    loadUserConfigs(): void {
        const dirInfo: string[] = this.fileService.getDirInfoSync(this.defaultConfigDir);
        dirInfo.forEach((filename: string) => {
            const fileContent: IUserConfig = this.fileService.loadJsonSync(this.defaultConfigDir, filename) as IUserConfig;
            this._insertUserConfig(fileContent.id, fileContent.properties);
        });
    }

    getConfigById(id: string): ISingleConfigModule {
        const moduleConfig = this._config[id];
        return isObject(moduleConfig) ? moduleConfig : {};
    }

    upadteConfig(id: string, key: string, value: any) {
        const configItem = this._config[id][key];
        const configType = configItem.type;
        if (getTypeof(value) !== configType) {
            this.logService.warn(`value "${value}" has the wrong type, ${id}-${key} is required a/an "${configType}" type`);
            return;
        }
        // save to memory.
        this._config[id][key].value = value;

        // save to user's config file (async).
        const moduleConfig: IUserConfig = {
            id,
            properties: {}
        };
        Object.entries(this._config[id]).forEach(item => {
            const _key = item[0];
            const _config = item[1];

            if (_config.value && _config.value !== _config.default) moduleConfig.properties[_key] = _config;
        });
        this.fileService.writeJson(this.userConfigDir, id, moduleConfig);
    }

    private _insertUserConfig(configId: IUserConfig['id'], userConfig: IUserConfig['properties']) {
        Object.entries(userConfig).forEach(item => {
            const key: string = item[0];
            const value: string | number | boolean | object | any[] = item[1];
            this._config[configId][key].value = value;
        });
    }

    private _writeConfigToFile() {}
}

export type ConfigItemType = string | number | boolean | object | any[];

export interface IConfig {
    [key: string]: ISingleConfigModule;
}

export interface ISingleConfigModule {
    [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'object' | 'array';
        default: ConfigItemType;
        desc: string;
        value?: ConfigItemType;
    };
}

export interface IDefaultConfig {
    [key: string]: IDefaultConfigItem;
}

export interface IDefaultConfigItem {
    type: 'Object' | ' Array';
    id: string;
    properties: {
        [key: string]: {
            type: 'string' | 'number' | 'boolean' | 'object' | 'array';
            default: ConfigItemType;
            desc: string;
            value?: ConfigItemType;
        };
    };
}

export interface IUserConfig {
    id: string;
    properties: {
        [key: string]: ConfigItemType;
    };
}
