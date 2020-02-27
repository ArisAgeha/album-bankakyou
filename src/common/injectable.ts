import 'reflect-metadata';

const classPool: Function[] = [];

export function injectable(_constructor: Function) {
    const paramsTypes: Function[] = Reflect.getMetadata('design:paramtypes', _constructor);
    if (classPool.indexOf(_constructor) !== -1) {
        return;
    }
    if (paramsTypes && paramsTypes.length) {
        paramsTypes.forEach((v, i) => {
            if (v === _constructor) throw new Error('the target can not dependent itself');
            if (classPool.indexOf(v) === -1) throw new Error(`dependency ${i}[${(v as any).name}] can not be injected`);
        });
    }
    classPool.push(_constructor);
}
export function createInstance<T>(_constructor: new (...args: any[]) => T): T {
    const paramsTypes: Function[] = Reflect.getMetadata('design:paramtypes', _constructor);
    const paramInstances = paramsTypes.map((v, i) => {
        if (classPool.indexOf(v) === -1) throw new Error(`parameter ${i}[${(v as any).name}] can not be injected`);
        if (v.length) return createInstance(v as any);
        return new (v as any)();
    });
    return new _constructor(...paramInstances);
}
