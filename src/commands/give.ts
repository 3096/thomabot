import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, Collection, CommandInteraction, DiscordAPIError, GuildMember, Message, MessageEmbed, TextChannel, User } from "discord.js";
import { Command } from "../command";
import { readData, writeData } from "../database";
import config from "../config";
import { durationToMs, formatTime, logError, mentionChannel, mentionUser, parseDuration, useEmoji } from "../utils";

const command_info = {
    name: "give",
    description: "Start a giveaway",
    subcommands: {
        create: {
            name: "create",
            description: "Host a new giveaway",
            options: {
                duration: { name: "duration", description: "How long does the giveaway last (e.g. 1D, 1H, 1M, 1S, 1D2H3M4S)" },
                quantity: { name: "winners", description: "How many winners" },
                prize: { name: "prize", description: "What the prize is" },
                channel: { name: "channel", description: "Which channel to host in" },
                host: { name: "host", description: "Who is hosting the giveaway" },
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
        .addMentionableOption(option => option
            .setName(command_info.subcommands.create.options.host.name)
            .setDescription(command_info.subcommands.create.options.host.description)
        )
    );


interface GiveawayData {
    ends: number,
    quatity: number,
    prize: string,
    channelId: string,
    messageId: string,
    hostMemberId: string,
    reactionEmojiId: string,
    winnerIds?: string[],
}

interface GiveawayDatabase {
    ongoingGiveaways: GiveawayData[],
    endedGiveaways: GiveawayData[],
    excludeList: string[],
}

const database: GiveawayDatabase = readData(command_info.name);

const durationMsMax = 2 ** 31 - 1;


function scheduleGiveaway(client: Client, data: GiveawayData) {
    setTimeout(() => concludeGiveaway(client, data), data.ends - Date.now());
}

function newGiveaway(client: Client, data: GiveawayData) {
    database.ongoingGiveaways.push(data);
    writeData(command_info.name, database);
    scheduleGiveaway(client, data);
}

function endGiveaway(data: GiveawayData) {
    database.endedGiveaways.push(data);
    const idx = database.ongoingGiveaways.findIndex(x => (x.messageId === data.messageId && x.channelId === data.channelId));
    database.ongoingGiveaways.splice(idx, 1);
    writeData(command_info.name, database);
}


const onReady = (client: Client) => {
    for (const data of database.ongoingGiveaways) {
        scheduleGiveaway(client, data);
    }
    console.log(`read: ${database.ongoingGiveaways.length} giveways`);
};

const executeCommand = async (interaction: CommandInteraction) => {
    const client = interaction.client;
    switch (interaction.options.getSubcommand()) {
        case command_info.subcommands.create.name:
            const duration = interaction.options.getString(command_info.subcommands.create.options.duration.name, true);
            const durationMs = durationToMs(parseDuration(duration.toUpperCase()));
            if (durationMs > durationMsMax) {
                interaction.reply(`${duration} 超出了最大值（${Math.floor(durationMsMax / 1000)}秒），如有需要请联系神里家家主 ${mentionUser(config.ADMIN_ID)}`);
                return;
            }
            if (durationMs === 0) {
                interaction.reply(`duration ${duration} 无效，请检查输入。支持的格式为 D, H, M, S，例如：1D, 1H, 1M, 1S, 1D2H3M4S`);
                return;
            }

            const quantity = interaction.options.getInteger(command_info.subcommands.create.options.quantity.name, true);
            if (quantity < 1) {
                interaction.reply(`${quantity} 不是有效的数量，请检查输入。`);
                return;
            }

            const prize = interaction.options.getString(command_info.subcommands.create.options.prize.name, true);
            if (prize.length < 1) {
                interaction.reply(`请检查prize输入。`);
                return;
            }

            let hostMemberId: string;
            const hostInput = interaction.options.getMentionable(command_info.subcommands.create.options.host.name);
            if (hostInput) {
                if ("user" in hostInput) {
                    hostMemberId = (hostInput as GuildMember).user.id;
                    if (hostMemberId === config.CLIENT_ID) {
                        interaction.reply(`I'll host it as long as you pay for it ${useEmoji("923598256792018994", "venti_rose")}`);
                        return;
                    }
                } else {
                    interaction.reply(`请检查host输入。`);
                    return;
                }
            } else {
                hostMemberId = interaction.member!.user.id
            }

            let channelId: string;
            const channelInput = interaction.options.getChannel(command_info.subcommands.create.options.channel.name);
            if (channelInput) {
                if (channelInput.type !== 'GUILD_TEXT') {
                    await interaction.reply(`${channelInput?.name} is not a supported channel`);
                    return;
                }
                channelId = channelInput.id;
            } else {
                channelId = config.GIVE_DEFAULT_CHANNEL;
            }

            const channel = client.channels.cache.get(channelId) as TextChannel;
            const ends = Date.now() + durationMs;

            // send giveaway msg
            const embed = new MessageEmbed()
                .setTitle(prize)
                .setColor('#DC143C')
                .setDescription(`点击下方表情参与！\n将随机选出${quantity}名赢家！\n截止：${formatTime(ends, "Relative")}\n本次抽奖由${mentionUser(hostMemberId)}提供`);
            const giveaway_message = await channel.send({
                content: `抽奖！${useEmoji("865504617819668510", "hutao1")}`, embeds: [embed]
            });

            await giveaway_message.react(config.GIVE_REACT_EMOTE)

            // save info
            const data: GiveawayData = {
                ends: ends,
                quatity: quantity,
                prize: prize,
                channelId: channelId,
                messageId: giveaway_message.id,
                hostMemberId: hostMemberId,
                reactionEmojiId: config.GIVE_REACT_EMOTE,
            };
            newGiveaway(client, data);

            // confirm it worked
            await interaction.reply(`搞定 ${useEmoji("923598256792018994", "venti_rose")}: ${mentionChannel(channelId)}`);

            break;

        default:
            throw Error("bad commannd");
    }
};

function getConcludeGiveawayMessage(prize: string, hostMemberId: string, winnerIds: string[]) {
    const embed = new MessageEmbed()
        .setTitle(prize)
        // .setColor('#DC143C')
        .setDescription(`获奖者：\n${winnerIds.map(id => mentionUser(id)).join("\n")}\n本次抽奖由${mentionUser(hostMemberId)}提供`);
    return { content: `抽奖结束 ${useEmoji("883973897001762837", "paimon_lay_down")}`, embeds: [embed] };
}

async function concludeGiveaway(client: Client, data: GiveawayData) {
    let channel: TextChannel, message: Message, reactionUsers: Collection<string, User>;
    try {
        channel = client.channels.cache.get(data.channelId) as TextChannel;
        message = await channel.messages.fetch(data.messageId);
        reactionUsers = await message.reactions.cache.get(data.reactionEmojiId)!.users.fetch();
    } catch (e) {
        if (!(e instanceof DiscordAPIError) || (e as DiscordAPIError).httpStatus !== 404) {
            throw e;
        }
        endGiveaway(data);
        logError(client, e, `[give] giveaway ended with error`);
        return;
    }

    const rafflePool = [];
    const excludeSet = new Set(database.excludeList);
    for (const userId of reactionUsers.keys()) {
        if (userId === config.CLIENT_ID) continue;
        if (excludeSet.has(userId)) continue;
        rafflePool.push(userId);
    }

    data.winnerIds = [];
    for (let i = 0; i < data.quatity; i++) {
        if (!rafflePool.length) break
        const winnerIdx = Math.floor(Math.random() * rafflePool.length);
        data.winnerIds.push(rafflePool[winnerIdx]);
        rafflePool.splice(winnerIdx, 1);
    }


    await message.edit(getConcludeGiveawayMessage(data.prize, data.hostMemberId, data.winnerIds));

    await channel.send(`恭喜 ${data.winnerIds.map(id => mentionUser(id)).join(" ")} 获奖！请联系${mentionUser(data.hostMemberId)}领取奖品：${data.prize}`);

    database.excludeList.push(...data.winnerIds)
    endGiveaway(data);
}

async function rerollGiveaway(client: Client, messageId: string, rerollExplaination: string,
    usersToBeReplaced: string[], usersToBeReinstated: string[]) {
    let data: GiveawayData;
    let i = database.endedGiveaways.length - 1;
    while (true) {
        if (i < 0) {
            throw Error("giveaway not found");
        }

        if (database.endedGiveaways[i].messageId === messageId) {
            data = database.endedGiveaways[i];
            break;
        }
        i--;
    }

    if (!data.winnerIds) {
        data.winnerIds = [];
    }

    database.excludeList = database.excludeList.filter(x => !usersToBeReinstated.includes(x));

    const channel = client.channels.cache.get(data.channelId) as TextChannel;
    const message = await channel.messages.fetch(data.messageId);
    const reactionUsers = await message.reactions.cache.get(data.reactionEmojiId)!.users.fetch();
    const rafflePool = [];
    const excludeSet = new Set(database.excludeList);
    data.winnerIds.forEach(x => excludeSet.add(x));

    for (const userId of reactionUsers.keys()) {
        if (userId === config.CLIENT_ID) continue;
        if (excludeSet.has(userId)) continue;

        rafflePool.push(userId);
    }

    let rerollWinners = [];
    for (const replacingUser of usersToBeReplaced) {
        if (!rafflePool.length) break;
        const winnerIdx = Math.floor(Math.random() * rafflePool.length);
        rerollWinners.push(rafflePool[winnerIdx]);
        data.winnerIds[data.winnerIds.indexOf(replacingUser)] = rafflePool[winnerIdx];
        rafflePool.splice(winnerIdx, 1);
    }

    await message.edit(getConcludeGiveawayMessage(data.prize, data.hostMemberId, data.winnerIds));

    await channel.send(`${rerollExplaination}\n恭喜 ${rerollWinners.map(id => mentionUser(id)).join(" ")} 获奖！请联系${mentionUser(data.hostMemberId)}领取奖品：${data.prize}`);

    database.excludeList.push(...rerollWinners);
    writeData(command_info.name, database);
}


const command: Command = {
    name: command_info.name,
    handler: executeCommand,
    commandBuilder: commandBuilder,
    onReady: onReady
}

export default command;
