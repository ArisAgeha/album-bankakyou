import 'reflect-metadata';
import { ConfigurationService } from '@/main/services/configuration.service';
import { FileService } from '@/main/services/file.service';
import { EnvironmentService } from '@/main/services/environment.service';
import { createInstance } from '@/common/decorator/injectable';
import { LogService } from '@/main/services/log.service';
import { Registry } from '@/common/registry';
import { ServiceCollection } from '@/common/serviceCollection';
import { app } from 'electron';
import { isFunction } from '@/common/types';
import { ChokidarService } from '../services/chokidar.service';
import { serviceConstant } from '@/common/constant/service.constant';

export class CodeMain {
    main(): void {
        this.startup();
    }

    private startup() {
        this.createServices();
    }

    private createServices(): void {
        const serviceCollection = new ServiceCollection();

        // create service by IOC
        const environmentService = createInstance(EnvironmentService);
        const logService = createInstance(LogService);
        const fileService = createInstance(FileService);
        const configurationService = createInstance(ConfigurationService);
        const chokidarService = createInstance(ChokidarService);

        // store service
        serviceCollection.set(serviceConstant.ENVIRONMENT, environmentService);
        serviceCollection.set(serviceConstant.LOG, logService);
        serviceCollection.set(serviceConstant.FILE, fileService);
        serviceCollection.set(serviceConstant.CONFIGURATION, configurationService);
        serviceCollection.set(serviceConstant.CHOKIDAR, chokidarService);

        // auto initial service
        environmentService.initial();
        configurationService.initial();
        fileService.initial();

        // mount service to electron.app.remote
        (global as any)['serviceCollection'] = serviceCollection;
    }
}
