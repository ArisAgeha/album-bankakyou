export function isPicture(fileOrDirUrl: string): boolean {
    return ['bmp', 'jpg', 'png', 'jpeg', 'exif', 'psd', 'webp', 'tif', 'tiff', 'gif', 'webm', '.mp4']
        .some(suffix => fileOrDirUrl.toLowerCase().endsWith(suffix));
}

export function isVideo(fileOrDirUrl: string): boolean {
    return ['webm', '.mp4'].some(suffix => fileOrDirUrl.toLowerCase().endsWith(suffix));
}

export function extractDirUrlFromKey(key: string): string {
    return key.slice(0, key.lastIndexOf('|'));
}

export function extractSuffixFromKey(key: string): string {
    return key.slice(key.lastIndexOf('|'));
}

export function extractDirNameFromKey(key: string): string {
    const dirName = extractDirUrlFromKey(key);
    return (dirName.match(/[^\\/]+$/) || []).pop();
}

export function extractDirNameFromUrl(url: string): string {
    return (url.match(/[^\\/]+$/) || []).pop();
}