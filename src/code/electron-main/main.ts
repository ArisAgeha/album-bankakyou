import { debounce } from 'common/decorator.ts';

export class CodeMain {
    main(): void {
        this.startup();
    }

    private async startup(): Promise<void> {
        this.createServices('aa', 'bb');
        this.createServices('cc', 'dd');
        this.createServices('ee', 'ff');

        setTimeout(() => this.createServices('222', '3333'), 1200);
    }

    @debounce(1000)
    private async createServices(a: string, b: string): Promise<void> {
        console.log('here is test');
        console.log(a);
        console.log(b);
    }
}
