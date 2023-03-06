import { Client, TextChannel } from 'discord.js';
import fs from "node:fs";
import path from "node:path";
import config from './config';
import { logError } from './utils';

const dataDir = "data"

const getFilePath = (name: string) => path.join('.', dataDir, name + '.json');

export function readData(name: string) {
    return JSON.parse(fs.readFileSync(getFilePath(name), { encoding: 'utf8' }));
}

export function writeData(name: string, data: unknown) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        fs.writeFile(getFilePath(name), JSON.stringify(data), (error) => {
            if (error) {
                reject(error);
            } else {
                resolve(undefined);
            }
        });
    });
}

export function startDailyBackup(client: Client) {
    setInterval(() => {
        const channel = client.channels.cache.get(config.BACKUP_CHANNEL) as TextChannel;
        fs.readdir(dataDir, (err, files) => {
            if (err) {
                logError(client, err);
                return;
            }

            const paths = files.map(file => ({ attachment: path.join(dataDir, file) }));
            channel.send({ files: paths });
        });

    }, 1000 * 60 * 60 * 24);
}
