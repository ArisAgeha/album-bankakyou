import { isString, isObject } from './types';

export interface IRegistry {
    add(id: string, data: any): void;
    knows(id: string): boolean;
    as<T>(id: string): T;
}

class RegistryImpl implements IRegistry {
    private readonly data: Map<string, any> = new Map<string, any>();

    public add(id: string, data: any): void {
        ok(isString(id));
        ok(isObject(data));
        ok(!this.data.has(id), 'There is already an extension with this id');

        this.data.set(id, data);
    }

    public knows(id: string): boolean {
        return this.data.has(id);
    }

    public as(id: string): any {
        return this.data.get(id) || null;
    }
}

export const Registry: IRegistry = new RegistryImpl();

/**
 * Throws an error with the provided message if the provided value does not evaluate to a true Javascript value.
 */
export function ok(value?: any, message?: string): void {
    if (!value) {
        throw new Error(message ? 'Assertion failed (' + message + ')' : 'Assertion Failed');
    }
}
