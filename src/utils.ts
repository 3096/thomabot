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

export type TimeFormat = "FullDateShort" | "FullDateLong" | "DateShort" | "DateLong" | "TimeShort" | "TimeLong" | "Relative";

const timeFormats: {
    [key in TimeFormat]: string
} = {
    FullDateShort: "f",
    FullDateLong: "F",
    DateShort: "d",
    DateLong: "D",
    TimeShort: "t",
    TimeLong: "T",
    Relative: "R"
}

export function formatTime(time: number, format: TimeFormat | null) {
    time = Math.floor(time / 1000);
    if (format === null) {
        return `<t:${time}>`;
    }
    return `<t:${time}:${timeFormats[format]}>`;
}

export async function fetchMessage(client: Client, channelId: string, messageId: string) {
    const channel = client.channels.cache.get(channelId) as TextChannel;
    return await channel.messages.fetch(messageId);
}


interface Duration {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}

export function parseDuration(duration: string) {
    const regex = /((\d+)Y)?((\d+)M)?((\d+)D)?((\d+)H)?((\d+)M)?((\d+)S)?/;
    const [, , years, , months, , days, , hours, , minutes, , seconds] = regex.exec(duration)!;

    return {
        years: parseInt(years || "0"),
        months: parseInt(months || "0"),
        days: parseInt(days || "0"),
        hours: parseInt(hours || "0"),
        minutes: parseInt(minutes || "0"),
        seconds: parseInt(seconds || "0"),
    } as Duration;
}

export function durationToMs(duration: Duration) {
    return (
        (duration.years ? duration.years * 1000 * 60 * 60 * 24 * 365 : 0) +
        (duration.months ? duration.months * 1000 * 60 * 60 * 24 * 30 : 0) +
        (duration.days ? duration.days * 1000 * 60 * 60 * 24 : 0) +
        (duration.hours ? duration.hours * 1000 * 60 * 60 : 0) +
        (duration.minutes ? duration.minutes * 1000 * 60 : 0) +
        (duration.seconds ? duration.seconds * 1000 : 0)
    );
}
