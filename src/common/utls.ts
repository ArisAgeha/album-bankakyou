export function toCamelCase(str: string, mark: string = '_') {
    const regexp: RegExp = new RegExp(`${mark}\\w`, 'g');
    return str.replace(regexp, (a: string, b: any) => a.slice(1).toUpperCase());
}
