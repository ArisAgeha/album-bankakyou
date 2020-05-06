import { isRegExp, isDate, isPrimitive, isArguments, isArray } from './types';
import { remote } from 'electron';

export function toCamelCase(str: string, mark: string = '_') {
    const regexp: RegExp = new RegExp(`${mark}\\w`, 'g');
    return str.replace(regexp, (a: string, b: any) => a.slice(1).toUpperCase());
}

export function isDev() {
    return !remote.app.isPackaged;
}
export function isProd() {
    return process.env.NODE_ENV !== 'development' || remote.app.isPackaged;
}

export function emptyCall(): void { }

export function toggleArrayItem<T>(arr: T[], item: T): T[] {
    const itemIndex = arr.indexOf(item);

    if (itemIndex === -1) {
        return [...arr, item];
    } else {
        const newArr = [...arr];
        newArr.splice(itemIndex, 1);
        return newArr;
    }
}

export function isSubArray<T>(mainArray: T[], checkArray: T[]) {
    const targetItemMap = new Map();
    mainArray.forEach((item) => {
        targetItemMap.set(item, true);
    });

    return checkArray.every(item => targetItemMap.has(item));
}

export function primitiveArrayDeepEqual(actual: any, expected: any) {
    if (!isArray(actual) || !isArray(expected)) return false;
    if (actual.length !== expected.length) return false;
    for (let i = 0; i < actual.length; i++) {
        if (actual[i] !== expected[i]) return false;
    }
    return true;
}

export function naturalCompare(a: any, b: any) {
    const ax: any[] = [];
    const bx: any[] = [];

    a.replace(/(\d+)|(\D+)/g, function(_: any, $1: any, $2: any) { ax.push([$1 || Infinity, $2 || '']); });
    b.replace(/(\d+)|(\D+)/g, function(_: any, $1: any, $2: any) { bx.push([$1 || Infinity, $2 || '']); });

    while (ax.length && bx.length) {
        const an = ax.shift();
        const bn = bx.shift();
        const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
        if (nn) return nn;
    }

    return ax.length - bx.length;
}

export function deepEqual(actual: any, expected: any, strict: boolean) {
    if (actual === expected) {
        return true;

    } else if (isDate(actual) && isDate(expected)) {
        return actual.getTime() === expected.getTime();

    } else if (isRegExp(actual) && isRegExp(expected)) {
        return actual.source === expected.source &&
            actual.global === expected.global &&
            actual.multiline === expected.multiline &&
            actual.lastIndex === expected.lastIndex &&
            actual.ignoreCase === expected.ignoreCase;

    } else if ((actual === null || typeof actual !== 'object') &&
        (expected === null || typeof expected !== 'object')) {
        return strict ? actual === expected : actual == expected;

    } else {
        return objEquiv(actual, expected, strict);
    }
}

function objEquiv(a: any, b: any, strict: boolean): boolean {
    if (a === null || a === undefined || b === null || b === undefined)
        return false;
    if (isPrimitive(a) || isPrimitive(b))
        return a === b;
    if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
        return false;

    const aIsArgs = isArguments(a);
    const bIsArgs = isArguments(b);
    if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
        return false;
    if (aIsArgs) {
        a = Array.prototype.slice.call(a);
        b = Array.prototype.slice.call(b);
        return deepEqual(a, b, strict);
    }

    const ka = Object.keys(a);
    const kb = Object.keys(b);

    if (ka.length !== kb.length)
        return false;

    ka.sort();
    kb.sort();

    for (let i = 0; i < ka.length; i++) {
        if (ka[i] !== kb[i])
            return false;
    }

    for (let i = 0; i < ka.length; i++) {
        const key = ka[i];
        if (!deepEqual(a[key], b[key], strict)) return false;
    }
    return true;
}