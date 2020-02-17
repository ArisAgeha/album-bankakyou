import { DConfigurationService, DFileService } from './main';

export class CodeMain2 {
    @DConfigurationService private readonly testval: any;
    @DFileService private readonly testval2: any;

    main(): void {
        this.startup();
    }

    private async startup(): Promise<void> {
        console.log(this.testval);
        console.log(this.testval2);
    }
}
