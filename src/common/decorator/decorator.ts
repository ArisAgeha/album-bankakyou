import { isNumber } from '../utils/types';

/**
 * flagsPosition: if `flagsPosition` is defined and its value >= 0
 * the timeout will use the fn's args[flagsPosition] as key
 * and the debounce will only work with the function which has the same key
 */
export function debounce<T>(delay: number, options: { flagsPostition?: number; isEvent?: boolean } = {}): Function {
    return createDecorator((fn: Function, key: string) => {
        let timerKey: string = `$debounce$${key}`;

        return function(this: any, ...args: any[]): void {
            if (isNumber(options?.flagsPostition) && options.flagsPostition >= 0) {
                timerKey = `$debounce$${key}-${args[options.flagsPostition]}`;
            }

            clearTimeout(this[timerKey]);

            // persist synthetic event
            if (options?.isEvent) args[0].persist();

            this[timerKey] = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    });
}

export function throttle<T>(delay: number, options: { isEvent?: boolean } = {}): Function {
    return createDecorator((fn: Function, key: string) => {
        const timerKey: string = `$throttle$timer$${key}`;
        const lastRunKey: string = `$throttle$lastRun$${key}`;
        const pendingKey: string = `$throttle$pending$${key}`;

        return function(this: any, ...args: any[]): void {
            if (this[pendingKey]) {
                return;
            }

            const nextTime: number = (this[lastRunKey] as number) + delay;
            if (nextTime <= Date.now()) {
                this[lastRunKey] = Date.now();
                fn.apply(this, args);
            } else {
                if (options?.isEvent) args[0].persist();
                this[pendingKey] = true;
                this[timerKey] = setTimeout(() => {
                    this[pendingKey] = false;
                    this[lastRunKey] = Date.now();
                    fn.apply(this, args);
                }, nextTime - Date.now());
            }
        };
    });
}

let memoizeId: number = 0;
export function createMemoizer(): Function {
    const memoizeKeyPrefix: string = `$memoize${memoizeId++}`;
    let self: any;

    const result = function memoize(target: any, key: string, descriptor: any): void {
        let fnKey: string | null = null;
        let fn: Function | null = null;

        if (typeof descriptor.value === 'function') {
            fnKey = 'value';
            fn = descriptor.value;

            if (fn!.length !== 0) {
                console.warn('Memoize should only be used in functions without parameter');
            }
        } else if (typeof descriptor.get === 'function') {
            fnKey = 'get';
            fn = descriptor.get;
        }

        if (!fn) {
            throw new Error('not supported');
        }

        const memoizeKey: string = `${memoizeKeyPrefix}:${key}`;
        descriptor[fnKey!] = function(...args: any[]): string {
            self = this;

            if (!this.hasOwnProperty(memoizeKey)) {
                Object.defineProperty(this, memoizeKey, {
                    configurable: true,
                    enumerable: false,
                    writable: true,
                    value: fn!.apply(this, args)
                });
            }

            return this[memoizeKey];
        };
    };

    result.clear = () => {
        if (typeof self === 'undefined') {
            return;
        }
        Object.getOwnPropertyNames(self).forEach(property => {
            if (property.indexOf(memoizeKeyPrefix) === 0) {
                delete self[property];
            }
        });
    };

    return result;
}

export function memoize(target: any, key: string, descriptor: any) {
    return createMemoizer()(target, key, descriptor);
}

function createDecorator(mapFn: (fn: Function, key: string) => Function): Function {
    return (target: any, key: string, descriptor: any): void => {
        let fnKey: string | null = null;
        let fn: Function | null = null;

        if (typeof descriptor.value === 'function') {
            fnKey = 'value';
            fn = descriptor.value;
        } else if (typeof descriptor.get === 'function') {
            fnKey = 'get';
            fn = descriptor.get;
        }

        if (!fn) {
            throw new Error('not supported');
        }

        descriptor[fnKey!] = mapFn(fn, key);
    };
}
