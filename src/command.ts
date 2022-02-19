import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import { Client, CommandInteraction, ApplicationCommandPermissionData } from "discord.js";
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums";
import config from "./config";

import give_command from "./commands/give";
import tell_command from "./commands/tell";
import echo_command from "./commands/echo";

const commands = [give_command, tell_command, echo_command];
export default commands;


export type SpecialPermissionTarget = "GUILD_OWNER" | "ADMIN";

interface CommandPermission {
    target: string | SpecialPermissionTarget;
    type: ApplicationCommandPermissionTypes;
    permission: boolean;
}

const specialPermissionHandler: {
    [key in SpecialPermissionTarget]: (client: Client, permission: boolean) => ApplicationCommandPermissionData;
} = {
    GUILD_OWNER: (client: Client, permission: boolean) => ({
        id: client.guilds.cache.get(config.GUILD_ID)!.ownerId,
        type: ApplicationCommandPermissionTypes.USER,
        permission: permission,
    }),
    ADMIN: (client: Client, permission: boolean) => ({
        id: config.ADMIN_ID,
        type: ApplicationCommandPermissionTypes.USER,
        permission: permission,
    }),
};

export function parseCommandPermission(client: Client, permission: CommandPermission): ApplicationCommandPermissionData {
    if (permission.target in specialPermissionHandler) {
        return specialPermissionHandler[permission.target as SpecialPermissionTarget](client, permission.permission);
    }
    return { id: permission.target as string, type: permission.type, permission: permission.permission };
}

export interface Command {
    name: string,
    handler: (interaction: CommandInteraction) => void,
    commandBuilder: () => SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder,
    onReady: (client: Client) => void,
    permissions?: CommandPermission[],
}
