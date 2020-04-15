import { app } from 'electron';

export function toCamelCase(str: string, mark: string = '_') {
    const regexp: RegExp = new RegExp(`${mark}\\w`, 'g');
    return str.replace(regexp, (a: string, b: any) => a.slice(1).toUpperCase());
}

export function isDev() {
    return !app.isPackaged;
}
export function isProd() {
    return process.env.NODE_ENV !== 'development' || app.isPackaged;
}

export function emptyCall(): void { }

export function isPicture(fileOrDirUrl: string): boolean {
    return ['bmp', 'jpg', 'png', 'jpeg', 'exif', 'psd', 'webp', 'tif', 'tiff', 'gif', 'webm', '.mp4'].some(suffix => fileOrDirUrl.endsWith(suffix.toLowerCase()));
}

export function isVideo(fileOrDirUrl: string): boolean {
    return ['webm', '.mp4'].some(suffix => fileOrDirUrl.endsWith(suffix.toLowerCase()));
}

export function extractDirUrlFromKey(key: string): string {
    return key.slice(0, key.lastIndexOf('|'));
}

export function extractSuffixFromKey(key: string): string {
    return key.slice(key.lastIndexOf('|'));
}

export function extractDirNameFromKey(key: string): string {
    const url = extractDirUrlFromKey(key);
    return (url.match(/[^\\/]+$/) || []).pop();
}

export function extractDirNameFromUrl(url: string): string {
    return (url.match(/[^\\/]+$/) || []).pop();
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