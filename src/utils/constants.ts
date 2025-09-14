import { ColorResolvable, EmbedAuthorData, MessageEmbed } from "discord.js";

export const EMBED_COLOR: ColorResolvable = 'DARK_RED' as const
export const EMBED_THUMBNAIL_URL: string = "https://www.coupedesregions.com/logo-cdr.png" as const
export const EMBED_URL: string = "https://coupedesregions.com" as const
export const EMBED_AUTHOR: EmbedAuthorData = {
    name: 'Coupe des Régions' as const,
    iconURL: "https://www.coupedesregions.com/logo-cdr.png" as const,
    url: "https://coupedesregions.com" as const
} as const
export const basisEmbed: MessageEmbed = new MessageEmbed()
    .setColor(EMBED_COLOR)
    .setThumbnail(EMBED_THUMBNAIL_URL)
    .setURL(EMBED_URL)
    .setAuthor(EMBED_AUTHOR)