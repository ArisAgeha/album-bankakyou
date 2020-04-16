import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import p from 'path';

export const readdir = promisify(fs.readdir);

export const stat = promisify(fs.stat);

export const writeFile = promisify(fs.writeFile);

export const rename = promisify(fs.rename);

export const unlink = promisify(fs.unlink);

export const lstat = promisify(fs.lstat);

export const chmod = promisify(fs.chmod);

export const readFile = promisify(fs.readFile);

export async function readdirWithFileTypes(path: string): Promise<fs.Dirent[]> {
    const children = await promisify(fs.readdir)(path, { withFileTypes: true });
    return children;
}

export async function mkdirp(path: string, mode?: number): Promise<void> {
    return promisify(fs.mkdir)(path, { mode, recursive: true });
}

export enum RimRafMode {
    /**
	 * Slow version that unlinks each file and folder.
	 */
    UNLINK,

    /**
	 * Fast version that first moves the file/folder
	 * into a temp directory and then deletes that
	 * without waiting for it.
	 */
    MOVE
}

export async function rimraf(path: string, mode = RimRafMode.UNLINK): Promise<void> {
    // delete: via unlink
    if (mode === RimRafMode.UNLINK) {
        return rimrafUnlink(path);
    }

    // delete: via move
    return rimrafMove(path);
}

async function rimrafUnlink(path: string): Promise<void> {
    try {
        const stat = await lstat(path);

        // Folder delete (recursive) - NOT for symbolic links though!
        if (stat.isDirectory() && !stat.isSymbolicLink()) {

            // Children
            const children = await readdir(path);
            await Promise.all(children.map(child => rimrafUnlink(join(path, child))));

            // Folder
            await promisify(fs.rmdir)(path);
        }

        // Single file delete
        else {

            // chmod as needed to allow for unlink
            const mode = stat.mode;
            if (!(mode & 128)) { // 128 === 0200
                await chmod(path, mode | 128);
            }

            return unlink(path);
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

async function rimrafMove(path: string): Promise<void> {
    try {
        const pathInTemp = join(os.tmpdir(), Math.random().toString().slice(2));
        try {
            await rename(path, pathInTemp);
        } catch (error) {
            return rimrafUnlink(path); // if rename fails, delete without tmp dir
        }

        // Delete but do not return as promise
        rimrafUnlink(pathInTemp);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

export function join(...path: string[]) {
    return p.resolve(...path);
}