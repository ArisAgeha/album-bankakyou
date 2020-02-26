import { ConfigurationService } from '@/services/configurationService';
import { ServiceCollection, createServiceDecorator, IServiceIdentifier } from '@/common/serviceCollection';
import { FileService } from '@/services/fileService';
import { EnvironmentService } from '@/services/environmentService';

export const DConfigurationService = createServiceDecorator('configurationService');
export const DEnvironmentService = createServiceDecorator('environmentService');
export const DFileService = createServiceDecorator('fileService');

export class CodeMain {
    main(): void {
        this.startup();
    }

    private async startup(): Promise<void> {
        this.createServices();
    }

    private createServices(): void {
        const services: ServiceCollection = new ServiceCollection();
        services.set(DConfigurationService, ConfigurationService);
        services.set(DEnvironmentService, EnvironmentService);
        services.set(DFileService, FileService);
    }
}
