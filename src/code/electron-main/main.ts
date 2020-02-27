import { ConfigurationService } from '@/services/configurationService';
import { FileService } from '@/services/fileService';
import { EnvironmentService } from '@/services/environmentService';
import { createInstance } from '@/common/injectable';
import { LogService } from '@/services/logService';

import '../../services/test';

export class CodeMain {
    main(): void {
        this.startup();
    }

    private async startup(): Promise<void> {
        this.createServices();
    }

    private createServices(): void {
        const environmentService = createInstance(EnvironmentService);
        const logService = createInstance(LogService);
        const fileService = createInstance(FileService);
        const configurationService = createInstance(ConfigurationService);

        configurationService.initial();
        console.log(configurationService.getConfigById('windows'));
    }
}
