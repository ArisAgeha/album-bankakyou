import { emptyCall } from './utils';
import { isArray } from './types';

export class EventHub {
    static events: { [key: string]: Function[] } = {};

    static emit(key: string, ...params: any[]) {
        const cbs: Function[] = EventHub.events[key];
        if (isArray(cbs)) {
            cbs.forEach(cb => {
                cb(...params);
            });
        }
    }

    static on(key: string, fn: Function) {
        const events = EventHub.events;
        events[key] ? (events[key].includes(fn) ? emptyCall() : events[key].push(fn)) : (events[key] = [fn]);
    }

    static cancel(key: string, fn: Function) {
        const cbsInHub = EventHub.events[key];
        const fnIndex = cbsInHub.indexOf(fn);
        cbsInHub.splice(fnIndex, 1);
    }
}
