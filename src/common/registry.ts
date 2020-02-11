import * as Assert from './assert';
import * as Types from './types';

export interface IRegistry {
    add(id: string, data: any): void;
    knows(id: string): boolean;
    as<T>(id: string): T;
}

class RegistryImpl implements IRegistry {
    private readonly data: Map<string, any> = new Map<string, any>();

    public add(id: string, data: any): void {
        Assert.ok(Types.isString(id));
        Assert.ok(Types.isObject(data));
        Assert.ok(
            !this.data.has(id),
            'There is already an extension with this id'
        );

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
