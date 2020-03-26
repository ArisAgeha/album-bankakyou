import React, { useState, useEffect } from 'react';
import Worker from 'worker-loader!../../webWorker/compress.worker.ts';

const worker = new Worker();
worker.addEventListener('error', (e) => {
    console.error(e);
});

export function CompressedImage(props: { dataUrl: string; imageType: string; resolution: number; quality: number }) {
    const { dataUrl, imageType, resolution, quality } = props;
    const [compressedSrc, setCompressedSrc] = useState('');

    useEffect(() => {
        worker.postMessage({ dataUrl, imageType, resolution, quality });
        worker.onmessage = e => {
            console.log('---');
            console.log(e);
        };
    });

    return <img src={compressedSrc} alt='' />;
}
