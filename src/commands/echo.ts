import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember, TextChannel } from "discord.js";
import { Command, SpecialPermissionTarget } from "../command";
import { isMod, mentionChannel } from "../utils";
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums";
import config from "../config";

const command_info = {
    name: "echo",
    description: "say something",
    options: {
        message: { name: "message", description: "Message to send" },
        channel: { name: "channel", description: "Which channel to message in" },
    },
};

const commandBuilder = () => new SlashCommandBuilder()
    .setName(command_info.name)
    .setDescription(command_info.description)
    .addStringOption(option => option
        .setName(command_info.options.message.name)
        .setDescription(command_info.options.message.description)
        .setRequired(true)
    )
    .addChannelOption(option => option
        .setName(command_info.options.channel.name)
        .setDescription(command_info.options.channel.description)
    )
    .setDefaultPermission(false);


const executeCommand = async (interaction: CommandInteraction) => {
    if (!isMod(interaction.member as GuildMember)) {
        await interaction.reply("你没有权限使用该指令。");
        return;
    }

    const client = interaction.client;
    const message = interaction.options.getString(command_info.options.message.name, true);

    const channelInput = interaction.options.getChannel(command_info.options.channel.name);
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
};

const command: Command = {
    name: command_info.name,
    handler: executeCommand,
    commandBuilder: commandBuilder,
    onReady: () => { },
    permissions: [
        {
            target: 'GUILD_OWNER' as SpecialPermissionTarget,
            type: ApplicationCommandPermissionTypes.USER, permission: true
        },
        {
            target: 'ADMIN' as SpecialPermissionTarget,
            type: ApplicationCommandPermissionTypes.USER, permission: true
        },
        ...config.MOD_ROLE_IDS.split(',').map(id => ({
            target: id, type: ApplicationCommandPermissionTypes.ROLE, permission: true
        })),
    ],
}

export default command;
