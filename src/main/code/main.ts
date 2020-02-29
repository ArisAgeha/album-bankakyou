import 'reflect-metadata';
import { ConfigurationService } from '@/main/services/configurationService';
import { FileService } from '@/main/services/fileService';
import { EnvironmentService } from '@/main/services/environmentService';
import { createInstance } from '@/common/decorator/injectable';
import { LogService } from '@/main/services/logService';
import { Registry } from '@/common/registry';
import { ServiceCollection } from '@/common/serviceCollection';
import { app } from 'electron';
import { isFunction } from '@/common/types';

export class CodeMain {
    main(): void {
        this.startup();
    }

    private async startup(): Promise<void> {
        this.createServices();
    }

    private createServices(): void {
        const serviceCollection = new ServiceCollection();

        // create service by IOC
        const environmentService = createInstance(EnvironmentService);
        const logService = createInstance(LogService);
        const fileService = createInstance(FileService);
        const configurationService = createInstance(ConfigurationService);

        // store service
        serviceCollection.set('environmentService', environmentService);
        serviceCollection.set('logService', logService);
        serviceCollection.set('fileService', fileService);
        serviceCollection.set('configurationService', configurationService);

        // auto initial service
        serviceCollection.forEach((id: string, instance: any): void => {
            if (isFunction(instance.initial)) instance.initial();
        });

        // mount service to electron.app.remote
        (app as any).serviceCollection = serviceCollection;
    }
}
