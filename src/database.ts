import fs from 'fs';
import path from 'path';

const dataDir = "data"

export function writeData(name: string, data: any, callback = () => { }) {
    fs.writeFile(path.join('.', dataDir, name + '.json'), JSON.stringify(data), callback);
}
