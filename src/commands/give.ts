import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed, TextChannel } from "discord.js";
import { Command } from "../command";
import { writeData } from "../database";
import config from "../config";

const command_info = {
    name: "give",
    description: "Start a giveaway",
    subcommands: {
        create: {
            name: "create",
            description: "Host a new giveaway",
            options: {
                duration: { name: "duration", description: "How long does the giveaway last" },
                quantity: { name: "winners", description: "How many winners" },
                prize: { name: "prize", description: "What the prize is" },
                channel: { name: "channel", description: "Which channel to host in" },
            }
        },
    },
}

const commandBuilder = () => new SlashCommandBuilder()
    .setName(command_info.name).setDescription(command_info.description)

    .addSubcommand(subcommand => subcommand
        .setName(command_info.subcommands.create.name)
        .setDescription(command_info.subcommands.create.description)
        .addStringOption(option => option
            .setName(command_info.subcommands.create.options.duration.name)
            .setDescription(command_info.subcommands.create.options.duration.description)
            .setRequired(true)
        )
        .addIntegerOption(option => option
            .setName(command_info.subcommands.create.options.quantity.name)
            .setDescription(command_info.subcommands.create.options.quantity.description)
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName(command_info.subcommands.create.options.prize.name)
            .setDescription(command_info.subcommands.create.options.prize.description)
            .setRequired(true)
        )
        .addChannelOption(option => option
            .setName(command_info.subcommands.create.options.channel.name)
            .setDescription(command_info.subcommands.create.options.channel.name)
        )
    );


interface GiveawayData {
    ends: Date,
    quatity: number,
    prize: string,
    messageId: string,
}

const execute = async (interaction: CommandInteraction) => {
    const client = interaction.client;
    switch (interaction.options.getSubcommand()) {
        case command_info.subcommands.create.name:
            const duration = interaction.options.getString(command_info.subcommands.create.options.duration.name, true);
            const quantity = interaction.options.getInteger(command_info.subcommands.create.options.quantity.name, true);
            const prize = interaction.options.getString(command_info.subcommands.create.options.prize.name, true);
            const channelInput = interaction.options.getChannel(command_info.subcommands.create.options.channel.name);
            const channelId = channelInput?.id ? channelInput.id : config.GIVE_DEFAULT_CHANNEL;
            const channel = client.channels.cache.get(channelId) as TextChannel;

            // send giveaway msg
            const embed = new MessageEmbed()
                .setTitle(prize)
                .setColor('#DC143C')
                .setDescription(`点击下方表情参与！\n将随机选出${quantity}名赢家！\n截止：2天后\n本次抽奖由<@${interaction.member?.user.id}>提供`)
            const giveaway_message = await channel.send({
                content: "抽奖！<:hutao1:865504617819668510>", embeds: [embed]
            });

            await giveaway_message.react(config.GIVE_REACT_EMOTE)

            // save info
            const data: GiveawayData = {
                ends: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), quatity: quantity, prize: prize, messageId: giveaway_message.id,
            };
            writeData(command_info.name, [data]);

            // schedule task
            // TODO:

            // update message?
            // TODO:

            // confirm it worked
            await interaction.reply(`搞定 <:venti_rose:923598256792018994>: <#${channelId}>`);

            break;

        default:
            throw Error("bad commannd");
    }
};

const command: Command = {
    name: command_info.name,
    handler: execute,
    commandBuilder: commandBuilder,
}

export default command;
