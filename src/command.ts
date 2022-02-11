import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import { Client, CommandInteraction } from "discord.js";

import give_command from "./commands/give";
import tell_command from "./commands/tell";

const commands = [give_command, tell_command];
export default commands;

export interface Command {
    name: string,
    handler: (interaction: CommandInteraction) => void,
    commandBuilder: () => SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder,
    onReady: (client: Client) => void,
}
