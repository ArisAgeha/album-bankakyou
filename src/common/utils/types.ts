// tslint:disable-next-line: typedef
const _typeof = {
    number: 'number',
    string: 'string',
    undefined: 'undefined',
    object: 'object',
    function: 'function'
};

/**
 * @returns whether the provided parameter is a JavaScript Array or not.
 */
export function isArray(array: any): array is any[] {
    if (Array.isArray) {
        return Array.isArray(array);
    }

    if (array && typeof array.length === _typeof.number && array.constructor === Array) {
        return true;
    }

    return false;
}

export function isString(str: any): str is string {
    if (typeof str === _typeof.string || str instanceof String) {
        return true;
    }

    return false;
}

export function isStringArray(value: any): value is string[] {
    return isArray(value) && value.every(isString);
}

export function isObject(obj: any): obj is object {
    return typeof obj === _typeof.object && obj !== null && !Array.isArray(obj) && !(obj instanceof RegExp) && !(obj instanceof Date);
}

export function isNumber(obj: any): obj is number {
    if ((typeof obj === _typeof.number || obj instanceof Number) && !isNaN(obj)) {
        return true;
    }

    return false;
}

export function isBoolean(obj: any): obj is boolean {
    return obj === true || obj === false;
}

export function isUndefined(obj: any): obj is undefined {
    return typeof obj === _typeof.undefined;
}

export function isUndefinedOrNull(obj: any): obj is undefined | null {
    return isUndefined(obj) || obj === null;
}
export function assertType(condition: any, type?: string): asserts condition {
    if (!condition) {
        throw new Error(type ? `Unexpected type, expected '${type}'` : 'Unexpected type');
    }
}

export function assertIsDefined<T>(arg: T | null | undefined): T {
    if (isUndefinedOrNull(arg)) {
        throw new Error('Assertion Failed: argument is undefined or null');
    }

    return arg;
}

export function isEmptyObject(obj: any): obj is any {
    const hasOwnProperty: any = Object.prototype.hasOwnProperty;
    if (!isObject(obj)) {
        return false;
    }

    for (const key in obj) {
        if (hasOwnProperty.call(obj, key)) {
            return false;
        }
    }

    return true;
}

export function isFunction(obj: any): obj is Function {
    return typeof obj === _typeof.function;
}

export function areFunctions(...objects: any[]): boolean {
    return objects.length > 0 && objects.every(isFunction);
}

export function getAllPropertyNames(obj: object): string[] {
    let res: string[] = [];
    let proto: any = Object.getPrototypeOf(obj);
    while (Object.prototype !== proto) {
        res = res.concat(Object.getOwnPropertyNames(proto));
        proto = Object.getPrototypeOf(proto);
    }
    return res;
}

export function getAllMethodNames(obj: object): string[] {
    const methods: string[] = [];
    for (const prop of getAllPropertyNames(obj)) {
        if (typeof (obj as any)[prop] === 'function') {
            methods.push(prop);
        }
    }
    return methods;
}

export function withNullAsUndefined<T>(x: T | null): T | undefined {
    return x === null ? undefined : x;
}

export function withUndefinedAsNull<T>(x: T | undefined): T | null {
    return typeof x === 'undefined' ? null : x;
}

/**
 * Get typeof value, instead of the origin 'typeof' API.
 * Return 'array' while value is an Array.
 */
export function getTypeof<T>(value: T) {
    switch (typeof value) {
        case 'object':
            return isObject(value) ? 'object' : 'array';
        default:
            return typeof value;
    }
}

export function isDate(d: any) {
    return isObject(d) && objectToString(d) === '[object Date]';
}

export function objectToString(o: any) {
    return Object.prototype.toString.call(o);
}

export function isRegExp(re: any) {
    return isObject(re) && objectToString(re) === '[object RegExp]';
}

export function isPrimitive(arg: any) {
    return arg === null ||
        typeof arg === 'boolean' ||
        typeof arg === 'number' ||
        typeof arg === 'string' ||
        typeof arg === 'symbol' ||
        typeof arg === 'undefined';
}

export function isArguments(object: any) {
    return Object.prototype.toString.call(object) == '[object Arguments]';
}