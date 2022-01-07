import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, CommandInteraction, MessageEmbed, TextChannel } from "discord.js";
import { Command } from "../command";
import { readData, writeData } from "../database";
import config from "../config";
import { mentionUser, useEmoji } from "../utils";

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
            const durationMs = 2 * 24 * 60 * 60 * 1000;  // TODO:

            const quantity = interaction.options.getInteger(command_info.subcommands.create.options.quantity.name, true);

            const prize = interaction.options.getString(command_info.subcommands.create.options.prize.name, true);

            const channelInput = interaction.options.getChannel(command_info.subcommands.create.options.channel.name);
            if (channelInput?.type !== 'GUILD_TEXT') {
                await interaction.reply(`${channelInput?.name} is not a supported channel`);
                return;
            }

            const channelId = channelInput?.id ? channelInput.id : config.GIVE_DEFAULT_CHANNEL;
            const channel = client.channels.cache.get(channelId) as TextChannel;

            const hostMemberId = interaction.member!.user.id;

            // send giveaway msg
            const embed = new MessageEmbed()
                .setTitle(prize)
                .setColor('#DC143C')
                .setDescription(`点击下方表情参与！\n将随机选出${quantity}名赢家！\n截止：${"2天"}后\n本次抽奖由${mentionUser(hostMemberId)}提供`)
            const giveaway_message = await channel.send({
                content: `抽奖！${useEmoji("865504617819668510", "hutao1")}`, embeds: [embed]
            });

            await giveaway_message.react(config.GIVE_REACT_EMOTE)

            // save info
            const data: GiveawayData = {
                ends: Date.now() + durationMs,
                quatity: quantity,
                prize: prize,
                channelId: channelId,
                messageId: giveaway_message.id,
                hostMemberId: hostMemberId,
                reactionEmojiId: config.GIVE_REACT_EMOTE,
            };
            newGiveaway(client, data);

            // confirm it worked
            await interaction.reply(`搞定 <:venti_rose:923598256792018994>: <#${channelId}>`);

            break;

        default:
            throw Error("bad commannd");
    }
};

async function concludeGiveaway(client: Client, data: GiveawayData) {
    const channel = client.channels.cache.get(data.channelId) as TextChannel;
    const message = await channel.messages.fetch(data.messageId);
    const reactionUsers = await message.reactions.cache.get(data.reactionEmojiId)!.users.fetch();
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

    const embed = new MessageEmbed()
        .setTitle(data.prize)
        // .setColor('#DC143C')
        .setDescription(`获奖者：\n${data.winnerIds.map(id => mentionUser(id)).join("\n")}\n本次抽奖由${mentionUser(data.hostMemberId)}提供`);
    await message.edit({ content: `抽奖结束 ${useEmoji("883973897001762837", "paimon_lay_down")}`, embeds: [embed] });

    await channel.send(`恭喜 ${data.winnerIds.map(id => mentionUser(id)).join(" ")} 获奖！请联系${mentionUser(data.hostMemberId)}领取奖品：${data.prize}`);

    database.excludeList.push(...data.winnerIds)
    endGiveaway(data);
}


const command: Command = {
    name: command_info.name,
    handler: executeCommand,
    commandBuilder: commandBuilder,
    onReady: onReady
}

export default command;
