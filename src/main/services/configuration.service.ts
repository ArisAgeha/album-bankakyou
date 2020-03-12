import { injectable } from '@/common/decorator/injectable';
import { FileService } from './file.service';
import { isObject, getTypeof } from '@/common/types';
import { LogService } from './log.service';
import { throttle, debounce } from '@/common/decorator/decorator';
import { isDev } from '@/common/utils';

@injectable
export class ConfigurationService {
    private _config: IConfig = {};
    private readonly defaultConfigDir: string;
    private readonly userConfigDir: string;

    constructor(private readonly fileService: FileService, private readonly logService: LogService) {
        this.defaultConfigDir = isDev ? 'src/configuration/default' : 'resources/app/configuration/default';
        this.userConfigDir = isDev ? 'src/configuration/user' : 'resources/app/configuration/user';
    }

    initial(): void {
        this._loadDefaultConfigs();
        this._loadUserConfigs();
    }

    getConfigById(id: string): ISingleConfigModule {
        const moduleConfig = this._config[id];
        return isObject(moduleConfig) ? moduleConfig : {};
    }

    getValue(id: string, itemName: string): ConfigItemType {
        const moduleConfig: ISingleConfigModule = this.getConfigById(id);
        const item = moduleConfig[itemName];
        if (!item) this.logService.error(`cant find value: ${id}-${itemName}`);
        return item.hasOwnProperty('value') ? item.value : item.default;
    }

    upadteUserConfig(newConfigs: Array<{ id: string; key: string; value: any }>) {
        newConfigs.forEach(config => {
            const { id, key, value } = config;

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

            const item = this._config[id][key];
            if (item.value === value || (!item.hasOwnProperty('value') && item.default === value)) return;

            // if input value is same with default value, delete key 'value' from this._config and file.
            if (item.default === value) delete item.value;
            else this._config[id][key].value = value;
            this._writeConfigToFile(id);
        });
    }

    @debounce(300, { flagsPostition: 0 })
    private _writeConfigToFile(id: string): void {
        const moduleConfig: IUserConfig = {
            id,
            properties: {}
        };
        Object.entries(this._config[id]).forEach(item => {
            const _key = item[0];
            const _config = item[1];

            if (_config.hasOwnProperty('value') && _config.value !== _config.default) moduleConfig.properties[_key] = _config.value;
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
            if (!this._config[configId][key]) return;
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
