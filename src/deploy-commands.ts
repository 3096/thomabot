import { REST, Routes } from 'discord.js';
import config from './config';

import commands, { parseCommandPermission } from './command';
import { Client, ApplicationCommandPermissions, GatewayIntentBits } from 'discord.js';


console.log('Started refreshing application (/) commands.');

const rest = new REST({ version: '10' }).setToken(config.TOKEN);
const response = await rest.put(
    Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
    { body: commands.map(command => command.commandBuilder().toJSON()) },
) as {
    id: string;
    guild_id: string;
    name: string;
}[];

console.log('Successfully reloaded application (/) commands.')

console.log(response);


// console.log('Setting permissions for application (/) commands.');

// const commandWithPermissions = Object.fromEntries(
//     commands.filter(command => command.permissions).map(command => [command.name, command]),
// );

// if (!(Object.keys(commandWithPermissions).length > 0)) {
//     console.log('No permissions to set.');
//     process.exit(0);
// }

// const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// client.once('ready', () => {
//     const permissions: ApplicationCommandPermissions[] = [];

//     for (const commandResponse of response) {
//         if (commandResponse.name in commandWithPermissions) {
//             permissions.push(...commandWithPermissions[commandResponse.name].permissions!.map(
//                 permission => parseCommandPermission(client, permission)
//             ));
//             console.log(`Loaded permissions for command ${commandResponse.name}`);
//         }
//     }

//     client.guilds.cache.get(config.GUILD_ID)?.commands.permissions.set({ permissions: permissions }).then(() => {
//         console.log('Successfully set permissions for application (/) commands.');
//     }).catch(error => {
//         console.error('Failed to set permissions for application (/) commands.', error);
//     }).finally(() => {
//         client.destroy();
//     });
// });

// client.login(config.TOKEN);
