import { Client, Intents } from 'discord.js';
import config from './config';

import commands from './command';
import { startDailyBackup } from './database';
import setPresence from './routines/presence';
import { setMemberCount } from './routines/stats';

const commandHandlers = Object.fromEntries(commands.map(c => [c.name, c.handler]));

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });

client.once('ready', () => {
	console.log('Ready!');
	for (const command of commands) {
		command.onReady(client);
	}

	startDailyBackup(client);
	setMemberCount(client);
	setPresence(client);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	commandHandlers[interaction.commandName](interaction);
	setPresence(client, true);
});

client.login(config.TOKEN);
