import { debounce } from 'common/decorator.ts';

export class CodeMain {
    main(): void {
        this.startup();
    }

    private async startup(): Promise<void> {
        await this.createServices();
    }

    private async createServices(): Promise<void> {}
}
