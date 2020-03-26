import Jimp from 'jimp';
// Worker.ts
const ctx: Worker = self as any;

// Respond to message from parent thread
ctx.addEventListener('message', (event) => {
    const { dataUrl, imageType, resolution, quality } = event.data;
    Jimp.read(dataUrl).then((img) => {
        const width = img.getWidth();
        const height = img.getHeight();
        const newImg = width > height ? img.resize(resolution, Jimp.AUTO) : img.resize(Jimp.AUTO, resolution);
        ctx.postMessage(img);
    });
});