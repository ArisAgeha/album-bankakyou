export function createDecorator(
    mapFn: (fn: Function, key: string) => Function
): Function {
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

export function debounce<T>(delay: number): Function {
    return createDecorator((fn: Function, key: string) => {
        const timerKey: string = `$debounce$${key}`;

        return function(this: any, ...args: any[]): void {
            clearTimeout(this[timerKey]);

            this[timerKey] = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    });
}

export function throttle<T>(delay: number): Function {
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
