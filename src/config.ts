import dotenv from "dotenv"

dotenv.config()

interface Config {
    TOKEN: string,
    CLIENT_ID: string,
    GUILD_ID: string,
    LOG_CHANNEL: string,
    MOD_ROLE_IDS: string,
    ADMIN_ID: string,

    GIVE_DEFAULT_CHANNEL: string,
    GIVE_REACT_EMOTE: string,
}

export default process.env as any as Config;  // eh, fuck it
