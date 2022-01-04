import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Command } from "../command";

const command_info = {
    name: "give",
    description: "Start a giveaway",
    subcommands: {
        create: {
            name: "create",
            description: "Host a new giveaway",
            options: {
                duration: { name: "duration", description: "How long does the giveaway last" },
                winnerCount: { name: "winners", description: "How many winners" },
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
            .setName(command_info.subcommands.create.options.winnerCount.name)
            .setDescription(command_info.subcommands.create.options.winnerCount.description)
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

const execute = async (interaction: CommandInteraction) => {
    switch (interaction.options.getSubcommand()) {
        case command_info.subcommands.create.name:
            await interaction.reply(JSON.stringify(interaction.options));
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
