import { injectable } from '@/common/decorator/injectable';

@injectable
export class LogService {
    constructor() {}

    log(message: any): void {
        console.log(message);
    }

    warn(message: any): void {
        console.warn(message);
    }

    error(message: any): void {
        console.error(message);
    }
}
