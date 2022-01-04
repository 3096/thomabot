import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Command } from "../command";

const command_name = "give";

const commandBuilder = new SlashCommandBuilder().setName(command_name).setDescription('Giveaways!')
    .addSubcommand(subcommand => subcommand
        .setName("create")
        .setDescription("Host a new giveaway")
        .addStringOption(option => option.setName("duration").setDescription("For how long").setRequired(true))
        .addIntegerOption(option => option.setName("winners").setDescription("How many winners").setRequired(true))
        .addStringOption(option => option.setName("prize").setDescription("What the prize is").setRequired(true))
        .addChannelOption(option => option.setName("channel").setDescription("Channel to host in"))
    );

const execute = async (interaction: CommandInteraction) => {
    console.log(interaction);
    await interaction.reply("aoseuh");
};

const command: Command = {
    name: command_name,
    handler: execute,
    commandBuilder: commandBuilder,
}

export default command;
