import { Client, Intents } from 'discord.js';
import { token } from './config.json';  // TODO: use dotenv or something

import commands from './commands/all-commands';

const commandHandlers = Object.fromEntries(commands.map(c => [c.name, c.handler]));

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	commandHandlers[interaction.commandName](interaction);
});

client.login(token);
