import React, { useState, useEffect } from 'react';
import Worker from 'worker-loader!../../webWorker/compress.worker.ts';

const worker = new Worker();
worker.addEventListener('error', e => {
    console.error(e);
});

export function CompressedImage(props: { dataUrl: string; imageType: string; resolution: number; quality: number }) {
    const { dataUrl, imageType, resolution, quality } = props;
    const [compressedSrc, setCompressedSrc] = useState('');

    useEffect(() => {
        const getImage = (dataUrl: string): Promise<HTMLImageElement> =>
            new Promise((resolve, reject) => {
                const image = new Image();
                image.src = dataUrl;
                image.onload = () => {
                    resolve(image);
                };
                image.onerror = (el: any, err: string) => {
                    reject(err);
                };
            });

        getImage(dataUrl).then(img => {
            worker.postMessage({ img, imageType, resolution, quality });
            worker.onmessage = e => {
                console.log('---');
                console.log(e);
            };
        });

    });

    return <img src={compressedSrc} alt='' />;
}
