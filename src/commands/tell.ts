import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, CommandInteraction, GuildMember, MessageEmbed, MessageOptions, TextChannel } from "discord.js";
import config from "../config";
import YAML from "yaml";
import { Command } from "../command";
import { readData, writeData } from "../database";
import { isMod, logError, mentionChannel, updateDatabaseAndReply } from "../utils";

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
        },

        sendRandom: {
            name: "send-random",
            description: "Send a random message from a list",
            options: {
                name: { name: "name", description: "Name of the list" },
                // channel: { name: "channel", description: "Which channel to message in" },
            },
        },
        saveRandom: {
            name: "save-random",
            description: "save a list of messages for random selection",
            options: {
                name: { name: "list-name", description: "Name of the list" },
                messageIdx: { name: "message-index", description: "Index of the message" },
                message: { name: "message-content", description: "What to say (when not set, indexed message will be deleted)" },
            }
        },
        listRandom: {
            name: "list-random",
            description: "show saved random message lists",
            options: {
                name: { name: "list-name", description: "Name of the list" },
            },
        },
        removeRandom: {
            name: "remove-random",
            description: "remove a random message list",
            options: {
                name: { name: "list-name", description: "Name of the list" },
            },
        },
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
    )

    .addSubcommand(subcommand => subcommand
        .setName(command_info.subcommands.sendRandom.name)
        .setDescription(command_info.subcommands.sendRandom.description)
        .addStringOption(option => option
            .setName(command_info.subcommands.sendRandom.options.name.name)
            .setDescription(command_info.subcommands.sendRandom.options.name.description)
            .setRequired(true)
        )
        // .addChannelOption(option => option
        //     .setName(command_info.subcommands.sendRandom.options.channel.name)
        //     .setDescription(command_info.subcommands.sendRandom.options.channel.description)
        // )
    )

    .addSubcommand(subcommand => subcommand
        .setName(command_info.subcommands.saveRandom.name)
        .setDescription(command_info.subcommands.saveRandom.description)
        .addStringOption(option => option
            .setName(command_info.subcommands.saveRandom.options.name.name)
            .setDescription(command_info.subcommands.saveRandom.options.name.description)
            .setRequired(true)
        )
        .addNumberOption(option => option
            .setName(command_info.subcommands.saveRandom.options.messageIdx.name)
            .setDescription(command_info.subcommands.saveRandom.options.messageIdx.description)
        )
        .addStringOption(option => option
            .setName(command_info.subcommands.saveRandom.options.message.name)
            .setDescription(command_info.subcommands.saveRandom.options.message.description)
        )
    )

    .addSubcommand(subcommand => subcommand
        .setName(command_info.subcommands.listRandom.name)
        .setDescription(command_info.subcommands.listRandom.description)
        .addStringOption(option => option
            .setName(command_info.subcommands.listRandom.options.name.name)
            .setDescription(command_info.subcommands.listRandom.options.name.description)
        )
    )

    .addSubcommand(subcommand => subcommand
        .setName(command_info.subcommands.removeRandom.name)
        .setDescription(command_info.subcommands.removeRandom.description)
        .addStringOption(option => option
            .setName(command_info.subcommands.removeRandom.options.name.name)
            .setDescription(command_info.subcommands.removeRandom.options.name.description)
            .setRequired(true)
        )
    );


interface TellData {
    tell: { [key: string]: MessageOptions },
    randomTellLists: { [key: string]: MessageOptions[] },
}
let database: TellData;

const onReady = (client: Client) => {
    try {
        database = readData(command_info.name) as TellData;
    } catch (error) {
        if ((error as any).code === "ENOENT") {
            database = { tell: {}, randomTellLists: {} };
            writeData(command_info.name, { database })
                .catch(error => logError(client, error));
        } else {
            logError(client, error as Error);
        }
    }
};

const canUseSave = (member: GuildMember) => isMod || config.TELL_SAVE_WHITE_LIST.split(",").includes(member.id);

async function showRandomList(interaction: CommandInteraction, name: string) {
    const embed = new MessageEmbed().setTitle(`Random List: ${name}`);
    database.randomTellLists[name].forEach((message, idx) => {
        const messageContent = message.content;
        embed.addField(idx.toString(), messageContent ? messageContent : YAML.stringify(database.tell[name]));
    });
    await interaction.reply({ embeds: [embed] });
}

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
            if (!(name in database.tell)) {
                await interaction.reply(`${name} is not a saved message.`);
                return;
            }
            const messageToSend = { ...database.tell[name] };
            if (messageToSend.content) {
                messageToSend.content = message + messageToSend.content;
            }

            const channelInput = interaction.options.getChannel(command_info.subcommands.send.options.channel.name);
            if (channelInput) {
                if (channelInput.type !== 'GUILD_TEXT') {
                    await interaction.reply(`${channelInput?.name} is not a supported channel`);
                    return;
                }
                const sentMsg = await (client.channels.cache.get(channelInput.id) as TextChannel).send(messageToSend);
                await interaction.reply(`Message sent to ${mentionChannel(sentMsg.channel.id)}`);

            } else {
                await interaction.reply(messageToSend);
            }

            break;
        }

        case command_info.subcommands.save.name: {
            if (!canUseSave(interaction.member as GuildMember)) {
                await interaction.reply("?????????????????????????????????");
                return;
            }

            let reply: string;

            const name = interaction.options.getString(command_info.subcommands.save.options.name.name, true);
            const message = interaction.options.getString(command_info.subcommands.save.options.message.name);
            if (message) {
                if (name in database.tell) {
                    reply = `updated ${name}`;
                } else {
                    reply = `created ${name}`;
                }

                database.tell[name] = { ...database.tell[name], content: message };
            } else {
                if (!(name in database.tell)) {
                    await interaction.reply(`${name} is not a saved message.`);
                    return;
                }
                reply = `deleted ${name}`;
                delete database.tell[name];
            }

            updateDatabaseAndReply(interaction, command_info.name, database, reply);
            break;
        }

        case command_info.subcommands.list.name: {
            const embed = new MessageEmbed().setTitle("Saved messages");
            for (const name in database.tell) {
                const messageContent = database.tell[name].content;
                embed.addField(name, messageContent ? messageContent : YAML.stringify(database.tell[name]));
            }
            await interaction.reply({ embeds: [embed] });
            break;
        }

        case command_info.subcommands.sendRandom.name: {
            const name = interaction.options.getString(command_info.subcommands.sendRandom.options.name.name, true);
            if (!(name in database.randomTellLists)) {
                await interaction.reply(`${name} is not a saved random message list.`);
                return;
            }
            if (database.randomTellLists[name].length === 0) {
                await interaction.reply(`${name} is empty.`);
                return;
            }
            const messageToSend = database.randomTellLists[name][Math.floor(Math.random() * database.randomTellLists[name].length)];
            // const channelInput = interaction.options.getChannel(command_info.subcommands.sendRandom.options.channel.name);
            // if (channelInput) {
            //     if (channelInput.type !== 'GUILD_TEXT') {
            //         await interaction.reply(`${channelInput?.name} is not a supported channel`);
            //         return;
            //     }
            //     const sentMsg = await (client.channels.cache.get(channelInput.id) as TextChannel).send(messageToSend);
            //     await interaction.reply(`Message sent to ${mentionChannel(sentMsg.channel.id)}`);

            // } else {
            //     await interaction.reply(messageToSend);
            // }
            await interaction.reply(messageToSend);
            break;
        }

        case command_info.subcommands.saveRandom.name: {
            if (!canUseSave(interaction.member as GuildMember)) {
                await interaction.reply("?????????????????????????????????");
                return;
            }

            const name = interaction.options.getString(command_info.subcommands.saveRandom.options.name.name, true);
            const message = interaction.options.getString(command_info.subcommands.saveRandom.options.message.name);
            const messageIdx = interaction.options.getNumber(command_info.subcommands.saveRandom.options.messageIdx.name);

            if (!(name in database.randomTellLists)) {
                if (message) {
                    database.randomTellLists[name] = [{ content: message }];
                    updateDatabaseAndReply(interaction, command_info.name, database, `saved to \`${name}\`: [0] ${message}`);
                } else {
                    database.randomTellLists[name] = [];
                    updateDatabaseAndReply(interaction, command_info.name, database, `created \`${name}\``);
                }
                return;
            }

            const messageList = database.randomTellLists[name];

            if (messageIdx !== null) {
                if (messageIdx < 0 || messageIdx >= database.randomTellLists[name].length) {
                    await interaction.reply(`${messageIdx} is not a valid index.`);
                    showRandomList(interaction, name);
                    return;
                }

                if (message) {
                    messageList[messageIdx] = { ...messageList[messageIdx], content: message };
                    updateDatabaseAndReply(interaction, command_info.name, database, `updated \`${name}\`: [${messageIdx}] ${message}`);
                } else {
                    const [deletedMessage] = messageList.splice(messageIdx, 1);
                    updateDatabaseAndReply(interaction, command_info.name, database, `deleted \`${name}\`: [${messageIdx}] ${deletedMessage.content}`);
                }
                return;
            }

            if (message) {
                messageList.push({ content: message });
                updateDatabaseAndReply(interaction, command_info.name, database, `added \`${name}\`: [${messageList.length - 1}] ${message}`);
                return;
            }

            showRandomList(interaction, name);
            return;
        }

        case command_info.subcommands.listRandom.name: {
            if (Object.keys(database.randomTellLists).length === 0) {
                await interaction.reply("There are no saved random message lists.");
                return;
            }

            const name = interaction.options.getString(command_info.subcommands.listRandom.options.name.name);
            if (!name) {
                const embed = new MessageEmbed().setTitle("Saved Random Lists")
                    .setDescription(`Use ${command_info.subcommands.listRandom.options.name.name} option to see inside a list.`);
                for (const name in database.randomTellLists) {
                    embed.addField(name, `${database.randomTellLists[name].length} messages`);
                }
                await interaction.reply({ embeds: [embed] });
                return;
            }
            if (!(name in database.randomTellLists)) {
                await interaction.reply(`${name} is not a saved random message list.`);
                return;
            }
            showRandomList(interaction, name);
            break;
        }

        case command_info.subcommands.removeRandom.name: {
            if (!canUseSave(interaction.member as GuildMember)) {
                await interaction.reply("?????????????????????????????????");
                return;
            }

            const name = interaction.options.getString(command_info.subcommands.removeRandom.options.name.name, true);
            if (!(name in database.randomTellLists)) {
                await interaction.reply(`${name} is not a saved random message list.`);
                return;
            }

            delete database.randomTellLists[name];

            updateDatabaseAndReply(interaction, command_info.name, database, `deleted \`${name}\``);
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
