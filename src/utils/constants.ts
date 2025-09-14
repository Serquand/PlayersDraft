import { ColorResolvable, EmbedAuthorData, MessageEmbed } from "discord.js";

export const EMBED_COLOR: ColorResolvable = 'DARK_RED' as const
export const EMBED_THUMBNAIL_URL: string = "https://www.coupedesregions.com/logo-cdr.png" as const
export const EMBED_AUTHOR: EmbedAuthorData = {
    name: 'Coupe des Régions' as const,
    iconURL: "https://www.coupedesregions.com/logo-cdr.png" as const,
    url: "https://coupedesregions.com" as const
} as const

export const basisEmbed = (): MessageEmbed => {
    const embed = new MessageEmbed()
        .setColor(EMBED_COLOR)
        .setThumbnail(EMBED_THUMBNAIL_URL)
        .setAuthor(EMBED_AUTHOR);

    return embed;
};

export const isProductionMode = (): boolean => {
    if(!process.env.NODE_ENV) return false
    const nodeEnvLower = process.env.NODE_ENV.toLowerCase()
    return ['prod', 'production'].includes(nodeEnvLower)
}

export const BASIS_LOCATION_OF_FILES = isProductionMode() ? 'dist/' : 'src/'