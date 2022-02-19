import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, CommandInteraction, GuildMember, TextChannel } from "discord.js";
import { Command } from "../command";
import { readData, writeData } from "../database";
import { isMod, logError, mentionChannel, preformat } from "../utils";

const command_info = {
    name: "tell",
    description: "save and repeat messages",
    subcommands: {
        send: {
            name: "send",
            description: "Send a saved message",
            options: {
                name: { name: "name", description: "Name of the message" },
                mentions: { name: "mentions", description: "Who to mention" },
                channel: { name: "channel", description: "Which channel to message in" },
            },
        },
        save: {
            name: "save",
            description: "add a message",
            options: {
                name: { name: "name", description: "Name of the message" },
                message: { name: "message", description: "What to say (when not set, named message will be deleted)" },
            }
        },
        list: {
            name: "list",
            description: "list saved messages",
        }
    },
};

const commandBuilder = () => new SlashCommandBuilder()
    .setName(command_info.name).setDescription(command_info.description)

    .addSubcommand(subcommand => subcommand
        .setName(command_info.subcommands.send.name)
        .setDescription(command_info.subcommands.send.description)
        .addStringOption(option => option
            .setName(command_info.subcommands.send.options.name.name)
            .setDescription(command_info.subcommands.send.options.name.description)
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName(command_info.subcommands.send.options.mentions.name)
            .setDescription(command_info.subcommands.send.options.mentions.description)
        )
        .addChannelOption(option => option
            .setName(command_info.subcommands.send.options.channel.name)
            .setDescription(command_info.subcommands.send.options.channel.description)
        )
    )

    .addSubcommand(subcommand => subcommand
        .setName(command_info.subcommands.save.name)
        .setDescription(command_info.subcommands.save.description)
        .addStringOption(option => option
            .setName(command_info.subcommands.save.options.name.name)
            .setDescription(command_info.subcommands.save.options.name.description)
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName(command_info.subcommands.save.options.message.name)
            .setDescription(command_info.subcommands.save.options.message.description)
        )
    )

    .addSubcommand(subcommand => subcommand
        .setName(command_info.subcommands.list.name)
        .setDescription(command_info.subcommands.list.description)
    );

interface TellData {
    [name: string]: {
        message: string,
    },
}
let database: TellData;

const onReady = (client: Client) => {
    try {
        database = readData(command_info.name) as TellData;
    } catch (error) {
        if ((error as any).code === "ENOENT") {
            database = {};
            writeData(command_info.name, { database })
                .catch(error => logError(client, error));
        } else {
            logError(client, error as Error);
        }
    }
};

const executeCommand = async (interaction: CommandInteraction) => {
    const client = interaction.client;
    switch (interaction.options.getSubcommand()) {
        case command_info.subcommands.send.name: {

            let message = "";

            const mentions = interaction.options.getString(command_info.subcommands.send.options.mentions.name);
            if (mentions) {
                message += mentions + " ";
            }

            const name = interaction.options.getString(command_info.subcommands.send.options.name.name, true);
            if (!(name in database)) {
                await interaction.reply(`${name} is not a saved message.`);
                return;
            }
            message += database[name].message;

            const channelInput = interaction.options.getChannel(command_info.subcommands.send.options.channel.name);
            if (channelInput) {
                if (channelInput.type !== 'GUILD_TEXT') {
                    await interaction.reply(`${channelInput?.name} is not a supported channel`);
                    return;
                }
                const sentMsg = await (client.channels.cache.get(channelInput.id) as TextChannel).send(message);
                await interaction.reply(`Message sent to ${mentionChannel(sentMsg.channel.id)}`);

            } else {
                await interaction.reply(message);
            }

            break;
        }

        case command_info.subcommands.save.name: {
            if (!isMod(interaction.member as GuildMember)) {
                await interaction.reply("你没有权限使用该指令。");
                return;
            }
            
            let reply: string;

            const name = interaction.options.getString(command_info.subcommands.save.options.name.name, true);
            const message = interaction.options.getString(command_info.subcommands.save.options.message.name);
            if (message) {
                if (name in database) {
                    reply = `updated ${name}`;
                } else {
                    reply = `created ${name}`;
                }

                database[name] = { message };
            } else {
                if (!(name in database)) {
                    await interaction.reply(`${name} is not a saved message.`);
                    return;
                }
                reply = `deleted ${name}`;
                delete database[name];
            }

            writeData(command_info.name, database).then(() => {
                interaction.reply(reply);
            }).catch(error => {
                logError(client, error);
                interaction.reply(`failed to save ${name}: ${error}`);
            });

            break;
        }

        case command_info.subcommands.list.name: {
            await interaction.reply(preformat(Object.keys(database).join("\n")));
            break;
        }

        default:
            throw Error("bad commannd");
    }
};

const command: Command = {
    name: command_info.name,
    handler: executeCommand,
    commandBuilder: commandBuilder,
    onReady: onReady
}

export default command;
