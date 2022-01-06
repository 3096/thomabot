import dotenv from "dotenv"

dotenv.config()

interface Config {
    TOKEN: string,
    CLIENT_ID: string,
    GUILD_ID: string,

    GIVE_DEFAULT_CHANNEL: string,
    GIVE_REACT_EMOTE: string,
}

export default process.env as any as Config;  // eh, fuck it
