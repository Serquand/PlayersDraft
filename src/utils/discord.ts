import { AnyChannel, Client, CommandInteraction, DMChannel, Message, NewsChannel, TextChannel } from "discord.js";

export const sendHiddenInteractionResponse = (interaction: CommandInteraction, content: string = 'Something went wrong') => {
    return interaction.reply({ content, ephemeral: true });
}

export const fetchChannel = async (client: Client, channelId: string): Promise<AnyChannel | null> => {
    try {
        const channel = await client.channels.fetch(channelId);
        return channel;
    } catch {
        return null;
    }
}

export const fetchMessage = async (client: Client, channelId: string, messageId: string): Promise<Message | null> => {
    const channel = await fetchChannel(client, channelId);
    if(!channel) {
        return null;
    }

    if (!(channel instanceof TextChannel || channel instanceof DMChannel || channel instanceof NewsChannel)) {
        console.error('Ce salon n\'est pas textuel, DM ou de type "news".');
        return null;
    }

    try {
        const message = await channel.messages.fetch(messageId);
        return message;
    } catch {
        return null;
    }
};

export const deleteMessage = async (client: Client, channelId: string, messageId: string) => {
    const message = await fetchMessage(client, channelId, messageId);
    if(message) await message.delete();
}