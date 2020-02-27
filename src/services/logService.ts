import { injectable } from '@/common/injectable';

@injectable
export class LogService {
    constructor() {}

    log(message: any): void {}

    warn(message: any): void {}

    error(message: any): void {}
}
