import React, { useState, useEffect } from 'react';

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

        const downscaleImage = async (dataUrl: string, imageType: string, resolution: number, quality: number): Promise<void> => {
            // Create a temporary image so that we can compute the height of the image.
            const image = await getImage(dataUrl);
            const oldWidth = image.naturalWidth;
            const oldHeight = image.naturalHeight;

            const longestDimension = oldWidth > oldHeight ? 'width' : 'height';
            const currentRes = longestDimension == 'width' ? oldWidth : oldHeight;

            if (currentRes > resolution) {
                // Calculate new dimensions
                const newSize =
                    longestDimension == 'width' ? Math.floor((oldHeight / oldWidth) * resolution) : Math.floor((oldWidth / oldHeight) * resolution);
                const newWidth = longestDimension == 'width' ? resolution : newSize;
                const newHeight = longestDimension == 'height' ? resolution : newSize;

                // Create a temporary canvas to draw the downscaled image on.
                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;

                // Draw the downscaled image on the canvas and return the new data URL.
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(image, 0, 0, newWidth, newHeight);
                const newDataUrl = canvas.toDataURL(imageType, quality);
                console.log('hi');
                setCompressedSrc(newDataUrl);
            } else {
                console.log('hi2');
                setCompressedSrc(dataUrl);
            }
        };

        downscaleImage(dataUrl, imageType, resolution, quality);
    });

    return <img src={compressedSrc} alt='' />;
}
