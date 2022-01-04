import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export interface Command {
    name: string,
    handler: (interaction: CommandInteraction) => void,
    commandBuilder: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder
}
