import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { toCamelCase } from '@/common/utils/functionTools';

const resourcesKey = ['windows', 'workbench', 'renderer'];
const languages = ['zh-cn', 'en'];

export default initI18n;

async function initI18n(lng: string) {
    const resources: { [key: string]: any } = await getResources();
    const camelCaseLng = toCamelCase(lng, '-');
    i18n.use(initReactI18next).init({
        resources,
        lng: camelCaseLng,
        keySeparator: false,
        interpolation: {
            escapeValue: false
        }
    });
}

async function getResources() {
    const resources: { [key: string]: any } = {};

    for (const lng of languages) {
        const lngToCamelCase = toCamelCase(lng, '-');

        resources[lngToCamelCase] = {
            translation: {}
        };
        const lngPartial = await Promise.all(
            resourcesKey.map(async key => {
                const json = await import(`./${lng}/${String(key)}.json`);
                return json;
            })
        );
        const mergedLngObj = lngPartial.reduce((pv, cv, index, array) => ({ ...cv, ...pv }));
        resources[lngToCamelCase].translation = mergedLngObj;
    }

    return resources;
}
