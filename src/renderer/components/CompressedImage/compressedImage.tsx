import React, { useState, useEffect } from 'react';
import Worker from 'worker-loader!../../webWorker/compress.worker.ts';
import { ipcRenderer } from 'electron';
import { command } from '@/common/constant/command.constant';
import { ICompressImageReturn } from '@/worker/electronWorker';

const worker = new Worker();
worker.addEventListener('error', e => {
    console.error(e);
});

export function CompressedImage(props: { url: string; imageType?: string; resolution: number; quality: number }) {
    const { url, imageType, resolution, quality } = props;
    const [compressedSrc, setCompressedSrc] = useState('');

    useEffect(() => {
        ipcRenderer.send(command.WORKER_COMPRESS_IMAGE, { url, imageType, resolution, quality });
        ipcRenderer.on(command.WORKER_RETURN_COMPRESSED_IMAGE, (event: Electron.IpcRendererEvent, data: ICompressImageReturn) => {
            const { file, id } = data;
            if (id === url) setCompressedSrc(file);

            console.log('----');
            console.log(data);
            console.log(id);
        });
    });

    return <img draggable={false} src={compressedSrc} alt='' />;
}
