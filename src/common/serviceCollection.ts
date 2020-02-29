export class ServiceCollection {
    private readonly _entries = new Map<string, any>();

    constructor(...entries: Array<[string, any]>) {
        for (const [id, service] of entries) {
            this.set(id, service);
        }
    }

    set<T>(id: string, instance: T): T {
        const result = this._entries.get(id);
        this._entries.set(id, instance);
        return result;
    }

    forEach(callback: (id: string, instance: any) => any): void {
        this._entries.forEach((value, key) => callback(key, value));
    }

    has(id: string): boolean {
        return this._entries.has(id);
    }

    get<T>(id: string): T {
        return this._entries.get(id);
    }
}
