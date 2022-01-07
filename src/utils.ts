export function mentionUser(id: string) {
    return `<@${id}>`;
}

export function useEmoji(id: string, name: string) {
    return `<:${name}:${id}>`;
}
