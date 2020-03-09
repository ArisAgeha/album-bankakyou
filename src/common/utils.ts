export function toCamelCase(str: string, mark: string = '_') {
    const regexp: RegExp = new RegExp(`${mark}\\w`, 'g');
    return str.replace(regexp, (a: string, b: any) => a.slice(1).toUpperCase());
}

export function isDev() {
    return process.env.NODE_ENV === 'development';
}
export function isProd() {
    return process.env.NODE_ENV !== 'development';
}

export function emptyCall(): void {}

export function isPicture(fileOrDirUrl: string): boolean {
    return ['bmp', 'jpg', 'png', 'jpeg', 'exif', 'psd', 'webp', 'tif', 'tiff', 'gif'].some(suffix => fileOrDirUrl.endsWith(suffix));
}
