import { Client, CommandInteraction, ApplicationCommandPermissions, SharedSlashCommand } from "discord.js";
import { ApplicationCommandPermissionType } from "discord-api-types/v10";
import config from "./config";

import give_command from "./commands/give";
import tell_command from "./commands/tell";
import echo_command from "./commands/echo";

const commands: Command[] = [give_command, tell_command, echo_command];
export default commands;


export type SpecialPermissionTarget = "GUILD_OWNER" | "ADMIN";

interface CommandPermission {
    target: string | SpecialPermissionTarget;
    type: ApplicationCommandPermissionType;
    permission: boolean;
}

const specialPermissionHandler: {
    [key in SpecialPermissionTarget]: (client: Client, permission: boolean) => ApplicationCommandPermissions;
} = {
    GUILD_OWNER: (client: Client, permission: boolean) => ({
        id: client.guilds.cache.get(config.GUILD_ID)!.ownerId,
        type: ApplicationCommandPermissionType.User,
        permission: permission,
    }),
    ADMIN: (_client: Client, permission: boolean) => ({
        id: config.ADMIN_ID,
        type: ApplicationCommandPermissionType.User,
        permission: permission,
    }),
};

export function parseCommandPermission(client: Client, permission: CommandPermission): ApplicationCommandPermissions {
    if (permission.target in specialPermissionHandler) {
        return specialPermissionHandler[permission.target as SpecialPermissionTarget](client, permission.permission);
    }
    return { id: permission.target as string, type: permission.type, permission: permission.permission };
}

export interface Command {
    name: string,
    handler: (interaction: CommandInteraction) => void,
    commandBuilder: () => SharedSlashCommand,
    onReady: (client: Client) => void,
    permissions?: CommandPermission[],
}
