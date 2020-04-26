export function isPicture(fileOrDirUrl: string): boolean {
    return ['bmp', 'jpg', 'png', 'jpeg', 'exif', 'psd', 'webp', 'tif', 'tiff', 'gif', 'webm', '.mp4']
        .some(suffix => fileOrDirUrl.toLowerCase().endsWith(suffix));
}

export function isVideo(fileOrDirUrl: string): boolean {
    return ['webm', '.mp4'].some(suffix => fileOrDirUrl.toLowerCase().endsWith(suffix));
}

export function extractDirUrlFromKey(key: string): string {
    if (key.indexOf('|') === -1) console.warn('warning: given props is not a key, please make sure that your code logic is right.');
    return key.slice(0, key.lastIndexOf('|'));
}

export function extractSuffixFromKey(key: string): string {
    if (key.indexOf('|') === -1) console.warn('warning: given props is not a key, please make sure that your code logic is right.');
    return key.slice(key.lastIndexOf('|'));
}

export function extractDirNameFromKey(key: string): string {
    if (key.indexOf('|') === -1) console.warn('warning: given props is not a key, please make sure that your code logic is right.');
    const dirName = extractDirUrlFromKey(key);
    return (dirName.match(/[^\\/]+$/) || []).pop();
}

export function extractDirNameFromUrl(url: string): string {
    if (url.indexOf('|') !== -1) console.warn('warning: given props is not format likes `url` but `key`, please make sure that your code logic is right.');
    return (url.match(/[^\\/]+$/) || []).pop();
}

export function encodeChar(url: string): string {
    if (url.indexOf('|') !== -1) console.warn('warning: given props is not format likes `url` but `key`, please make sure that your code logic is right.');
    return url.replace('#', encodeURIComponent('#'));
}