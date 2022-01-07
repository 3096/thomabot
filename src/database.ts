import fs from 'fs';
import path from 'path';

const dataDir = "data"

const getFilePath = (name: string) => path.join('.', dataDir, name + '.json');

export function readData(name: string) {
    return JSON.parse(fs.readFileSync(getFilePath(name), { encoding: 'utf8' }));
}

export function writeData(name: string, data: any, callback = () => { }) {
    fs.writeFile(getFilePath(name), JSON.stringify(data), callback);
}
