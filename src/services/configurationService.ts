import { injectable } from '@/common/injectable';
import { FileService } from './fileService';
import { isObject, getTypeof } from '@/common/types';
import { LogService } from './logService';

@injectable
export class ConfigurationService {
    constructor(private readonly fileService: FileService, private readonly logService: LogService) {}

    private _config: IConfig = {};
    private readonly defaultConfigDir: string = 'src/configuration/default';
    private readonly userConfigDir: string = 'src/configuration/user';

    initial(): void {
        this._loadDefaultConfigs();
        this._loadUserConfigs();
    }

    getConfigById(id: string): ISingleConfigModule {
        const moduleConfig = this._config[id];
        return isObject(moduleConfig) ? moduleConfig : {};
    }

    upadteUserConfig(id: string, key: string, value: any) {
        const configItem = this._config[id][key];
        if (!configItem) {
            this.logService.warn(`cannot find config: '${key}' in ${id}`);
            return;
        }
        const configType = configItem.type;
        if (!configType.includes(getTypeof(value))) {
            this.logService.warn(`value "${value}" has the wrong type, ${id}-${key} is required "${configType}"`);
            return;
        }

        // if input value is same with default value, delete key 'value' from this._config and file.
        if (this._config[id][key].default === value) delete this._config[id][key].value;
        else this._config[id][key].value = value;

        this._writeConfigToFile(id);
    }

    private _writeConfigToFile(id: string): void {
        const moduleConfig: IUserConfig = {
            id,
            properties: {}
        };
        Object.entries(this._config[id]).forEach(item => {
            const _key = item[0];
            const _config = item[1];

            if (_config.value && _config.value !== _config.default) moduleConfig.properties[_key] = _config.value;
        });
        this.fileService.writeJson(this.userConfigDir, id, moduleConfig);
    }

    private _loadDefaultConfigs(): void {
        const config: IConfig = {};
        const dirInfo: string[] = this.fileService.getDirInfoSync(this.defaultConfigDir);
        dirInfo.forEach((filename: string) => {
            const fileContent: IDefaultConfigItem = this.fileService.loadJsonSync(this.defaultConfigDir, filename);
            config[fileContent.id] = fileContent.properties;
        });
        this._config = config;
    }

    private _loadUserConfigs(): void {
        const dirInfo: string[] = this.fileService.getDirInfoSync(this.userConfigDir);
        dirInfo.forEach((filename: string) => {
            const fileContent: IUserConfig = this.fileService.loadJsonSync(this.userConfigDir, filename) as IUserConfig;
            this._insertUserConfig(fileContent.id, fileContent.properties);
        });
    }

    private _insertUserConfig(configId: IUserConfig['id'], userConfig: IUserConfig['properties']) {
        Object.entries(userConfig).forEach(item => {
            const key: string = item[0];
            const value: string | number | boolean | object | any[] = item[1];
            this._config[configId][key].value = value;
        });
    }
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
