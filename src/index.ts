import { Client, Intents } from 'discord.js';
import config from './config';

import commands from './command';

const commandHandlers = Object.fromEntries(commands.map(c => [c.name, c.handler]));

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
	console.log('Ready!');
	for (const command of commands) {
		command.onReady(client);
	}
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	commandHandlers[interaction.commandName](interaction);
});

client.login(config.TOKEN);
