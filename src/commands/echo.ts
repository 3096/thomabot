import { CommandInteraction, GuildMember, TextChannel, SlashCommandBuilder, ChannelType } from "discord.js";
import { ApplicationCommandPermissionType } from "discord-api-types/v10";
import { Command, SpecialPermissionTarget } from "../command";
import { isMod, mentionChannel } from "../utils";
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

    const message = interaction.options.get(command_info.options.message.name, true).value as string;

    const channelOption = interaction.options.get(command_info.options.channel.name);
    if (channelOption) {
        if (channelOption.channel!.type !== ChannelType.GuildText) {
            await interaction.reply(`${channelOption?.name} is not a supported channel`);
            return;
        }
        const sentMsg = await (channelOption.channel as TextChannel).send(message);
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
            type: ApplicationCommandPermissionType.User, permission: true
        },
        {
            target: 'ADMIN' as SpecialPermissionTarget,
            type: ApplicationCommandPermissionType.User, permission: true
        },
        ...config.MOD_ROLE_IDS.split(',').map(id => ({
            target: id, type: ApplicationCommandPermissionType.Role, permission: true
        })),
    ],
}

export default command;
