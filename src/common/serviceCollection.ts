export interface IServiceIdentifier<T> {
    (...args: any[]): void;
    type: T;
}

const _util = {
    serviceIds: new Map<string, IServiceIdentifier<any>>(),

    DI_TARGET: '$di$target',
    DI_DEPENDENCIES: '$di$dependencies',

    getServiceDependencies(
        ctor: any
    ): Array<{
        id: IServiceIdentifier<any>;
        index: number;
        optional: boolean;
    }> {
        return ctor[_util.DI_DEPENDENCIES] || [];
    }
};

function storeServiceDependency(id: Function, target: Function, index: number, optional: boolean): void {
    if ((target as any)[_util.DI_TARGET] === target) {
        (target as any)[_util.DI_DEPENDENCIES].push({ id, index, optional });
    } else {
        (target as any)[_util.DI_DEPENDENCIES] = [{ id, index, optional }];
        (target as any)[_util.DI_TARGET] = target;
    }
}

export function createServiceDecorator<T>(serviceId: string): IServiceIdentifier<T> {
    if (_util.serviceIds.has(serviceId)) {
        return _util.serviceIds.get(serviceId)!;
    }

    const id = function(target: Function, key: string, index: number): any {
        if (arguments.length !== 3) {
            throw new Error('service decorator can only be used to decorate a parameter');
        }
        storeServiceDependency(id, target, index, false);
    } as any;

    id.toString = () => serviceId;

    _util.serviceIds.set(serviceId, id);
    return id;
}

export class ServiceCollection {
    private readonly _entries = new Map<IServiceIdentifier<any>, any>();

    constructor(...entries: Array<[IServiceIdentifier<any>, any]>) {
        for (const [id, service] of entries) {
            this.set(id, service);
        }
    }

    set<T>(id: IServiceIdentifier<T>, instanceOrDescriptor: T): T {
        const result = this._entries.get(id);
        this._entries.set(id, instanceOrDescriptor);
        return result;
    }

    has(id: IServiceIdentifier<any>): boolean {
        return this._entries.has(id);
    }

    get<T>(id: IServiceIdentifier<T>): T {
        return this._entries.get(id);
    }

    forEach(cb: (id: IServiceIdentifier<any>, instanceOrDescriptor: any) => any): void {
        this._entries.forEach((value, key) => cb(key, value));
    }
}
