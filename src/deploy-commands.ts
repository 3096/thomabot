import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import config from './config';

import commands from './commands/all-commands';

export default function deployCommands() {
    const rest = new REST({ version: '9' }).setToken(config.TOKEN);

    (async () => {
        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
                { body: commands.map(command => command.commandBuilder().toJSON()) },
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })();
}
