import fs from 'fs';
import { rm } from 'node:fs/promises'; // Use fs/promises for async/await

function createFolder(pathFolder: string) {
    if (!fs.existsSync(pathFolder)) {
        fs.mkdirSync(pathFolder);
        console.log(`Folder '${pathFolder}' created.`);
    }
}

function createFile(pathFile: string, content: string) {
    const data = new Uint8Array(Buffer.from(content));

    fs.writeFile(pathFile, data, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
    console.log(`Folder '${pathFile}' created.`);
}

function readFile(pathFile: string, callback: (content: string) => void) {
    fs.readFile(pathFile, (err, data) => {
        if (err) throw err;

        const decoder = new TextDecoder('utf-8');
        const str = decoder.decode(data.buffer);
        callback(str);
    });
}

function readFileAsync(pathFile: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(pathFile, (err, data) => {
            if (err) throw err;

            const decoder = new TextDecoder('utf-8');
            const str = decoder.decode(data.buffer);

            resolve(str);
        });
    })
}

async function deleteFolder(folderPath: string) {
    try {
        await rm(folderPath, { recursive: true, force: true });
        console.log(`Folder and its contents deleted: ${folderPath}`);
    } catch (err: any) {
        console.error(`Error deleting folder: ${err.message}`);
    }
}

function base64ToUt8(file: string) {
    const binString = atob(file);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    const decoder = new TextDecoder("utf-8");

    return decoder.decode(bytes);
}

export { createFolder, createFile, deleteFolder, readFile, readFileAsync, base64ToUt8 }