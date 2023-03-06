import { Client, GatewayIntentBits } from "discord.js";
import config from "./config";

import commands from "./command";
import { logError } from "./utils";
import { startDailyBackup } from "./database";
import setPresence from "./routines/presence";
import { setMemberCount } from "./routines/stats";

const commandHandlers = Object.fromEntries(
    commands.map((c) => [c.name, c.handler])
);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
});

client.once("ready", () => {
    console.log("Ready!");
    for (const command of commands) {
        command.onReady(client);
    }

    startDailyBackup(client);
    setMemberCount(client);
    setPresence(client);
});

client.on("interactionCreate", (interaction) => {
    if (!interaction.isCommand()) return;
    try {
        commandHandlers[interaction.commandName](interaction);
    } catch (e) {
        console.error(e);
        logError(client, e as Error);
    }
    setPresence(client, true);
});

client.login(config.TOKEN);
