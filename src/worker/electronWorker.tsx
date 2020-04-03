import * as React from 'react';
import { Event, app, remote, ipcRenderer } from 'electron';
import 'reflect-metadata';
import { command } from '@/common/constant/command.constant';

export interface ICompressImageParams {
    url: string;
    resolution: number;
    quality: number;
    imageType: string;
}

export interface ICompressImageReturn {
    file: string;
    id: string;
}

class ElectronWorker extends React.PureComponent<any, any> {
    componentDidMount() {
        this.initEvent();
    }

    initEvent() {
        ipcRenderer.on(command.WORKER_COMPRESS_IMAGE, this.compressImage);
    }

    compressImage = (event: Electron.IpcRendererEvent, data: ICompressImageParams) => {
        const { url, resolution, quality, imageType } = data;
        console.log(data);
        this.downscaleImage(url, imageType, resolution, quality);
    };

    getImage = (dataUrl: string): Promise<HTMLImageElement> =>
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

    downscaleImage = async (dataUrl: string, imageType: string, resolution: number, quality: number): Promise<void> => {
        // Create a temporary image so that we can compute the height of the image.
        const image = await this.getImage(dataUrl);
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
            ipcRenderer.send(command.WORKER_RETURN_COMPRESSED_IMAGE, { file: newDataUrl, id: dataUrl });
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = oldWidth;
            canvas.height = oldHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(image, 0, 0, oldWidth, oldHeight);
            const newDataUrl = canvas.toDataURL(imageType, quality);

            ipcRenderer.send(command.WORKER_RETURN_COMPRESSED_IMAGE, { file: newDataUrl, id: dataUrl });
        }
    };

    render(): JSX.Element {
        return <div></div>;
    }
}

export { ElectronWorker };
