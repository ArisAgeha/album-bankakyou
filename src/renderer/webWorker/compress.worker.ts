// const Jimp = require('jimp');
const ctx: Worker = self as any;
import fs from 'fs';

ctx.addEventListener('message', async event => {
    const { img, imageType, resolution, quality } = event.data;
    ctx.postMessage(img);
    // Jimp.read(dataUrl).then((img: any) => {
    //     const width = img.getWidth();
    //     const height = img.getHeight();
    //     const newImg = width > height ? img.resize(resolution, Jimp.AUTO) : img.resize(Jimp.AUTO, resolution);
    //     ctx.postMessage(img);
    // });
});
