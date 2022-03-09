import { Client } from "discord.js";

let intervalSet = false;
const setPresence = (client: Client, isSummoned: boolean = false) => {
    if (isSummoned) {
        client.user!.setPresence({ status: 'online' });
        return;
    }

    if (intervalSet) return;
    setInterval(() => {
        if (Math.random() > 0.5) {
            client.user!.setPresence({ status: 'idle', activities: [{ type: 'PLAYING', name: '打理庭院...' }] });
        } else {
            client.user!.setPresence({ status: 'idle', activities: [{ type: 'PLAYING', name: '煎茶...' }] });
        }
    }, (Math.random() * 11 + 7) * 60 * 1000);
    intervalSet = true;
};

export default setPresence;
