import { AutocompleteInteraction, Client, CommandInteraction, PermissionResolvable } from "discord.js";
import DraftService from "../../services/Draft.service";
import { sendHiddenInteractionResponse } from "../../utils/discord";
import games, { Game } from "../../services/Game.service";
import { DraftStatus } from "../../utils/Interfaces";

const command = {
    name: 'launch_draft',
    order: 2,
    options: [
        {
            name: "draft",
            type: "STRING",
            required: true,
            description: "Draft à supprimer",
            autocomplete: true
        },
        {
            name: 'channel_name',
            type: 'CHANNEL',
            required: true,
            description: 'Nom du channel où la draft sera lancée'
        }
    ],
    description: "Lancer une draft existante",
    runSlash: async (client: Client, interaction: CommandInteraction) => {
        const draftName = interaction.options.getString("draft", true);
        const channel = interaction.options.getChannel("channel_name", true);
        const draft = await DraftService.getDraftByName(draftName, ['streamers', 'players', 'streamers.players']);

        if(channel.type !== 'GUILD_TEXT') { // Check if the channel is a text channel
            return sendHiddenInteractionResponse(interaction, "Le channel doit être un channel texte.");
        }
        if (!draft || draft.status !== DraftStatus.NOT_STARTED) { // Check if the draft exists
            return sendHiddenInteractionResponse(interaction, "Draft introuvable ou déjà commencée / terminée");
        }
        if (draft.streamers.length < 2) {
            return sendHiddenInteractionResponse(interaction, "Une draft doit avoir au moins 2 streamers pour être lancée.");
        }
        if (draft.players.length < 1) {
            return sendHiddenInteractionResponse(interaction, "Une draft doit avoir au moins 1 joueur pour être lancée.");
        }
        if (games[channel.id]) { // Check if a draft is already running in the channel
            return sendHiddenInteractionResponse(interaction, "Une draft est déjà en cours dans ce channel.");
        }

        // Fix the permissions of the channel - Only the streamers and the bot can send messages and add reactions
        await channel.permissionOverwrites.set([
            {
                id: interaction.guild!.roles.everyone,
                deny: ['SEND_MESSAGES', 'ADD_REACTIONS'],
            },
            ...draft.streamers.map(s => ({
                id: s.discordId,
                allow: ['VIEW_CHANNEL', 'ADD_REACTIONS', 'SEND_MESSAGES'] as PermissionResolvable[],
            })),
            {
                id: client.user!.id, // The bot
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ADD_REACTIONS'],
            }
        ]);

        games[channel.id] = new Game(draft, channel);
        if (!await games[channel.id].launchDraft()) {
            return sendHiddenInteractionResponse(interaction, `The draft has a problem in its data and can't be launched ! En théorie c'est censé jamais arriver mais bon... Si vous avez ce message, contactez-moi les reufs ❤️`)
        }

        return sendHiddenInteractionResponse(interaction, `Draft **${draft.name}** lancée dans le channel ${channel}`);
    },
    autocomplete: async (interaction: AutocompleteInteraction) => DraftService.autocompleteDraft(interaction)
}

export default command;