import { Client, TextChannel } from "discord.js";
import config from "./config";

export function logError(client: Client, error: Error) {
    const channel = client.channels.cache.get(config.LOG_CHANNEL) as TextChannel;
    channel.send(error.name);
    channel.send(error.message);
    channel.send(error.stack!);
}

export function mentionUser(id: string) {
    return `<@${id}>`;
}

export function useEmoji(id: string, name: string) {
    return `<:${name}:${id}>`;
}

export function mentionChannel(id: string) {
    return `<#${id}>`;
}
