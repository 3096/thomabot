import { Client, GuildChannel } from "discord.js";
import config from "../config";


let lock = false;
let tryAgain = false;

export function setMemberCount(client: Client) {
    const updateMemberCount = async () => {
        if (lock) {
            console.log(`API currently limited, flagging to retry later.`);
            tryAgain = true;
            return;
        }

        do {
            lock = true;
            tryAgain = false;

            const members = await client.guilds.cache.get(config.GUILD_ID)!.members.fetch();
            const memberCount = members.filter(member => !member.user.bot).size + 1;
            console.log(`Attepting to update member count: ${memberCount}`);

            const channel = await (client.channels.cache.get(config.STATS_MEMBER_COUNT_CHANNEL)! as GuildChannel).setName(`群人数：${memberCount}`);
            console.log(`Member count updated: ${channel.name}`);

            lock = false;
        } while (tryAgain);
    };

    client.on('guildMemberAdd', updateMemberCount);
    client.on('guildMemberRemove', updateMemberCount);
    updateMemberCount();
}
