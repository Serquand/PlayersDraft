import { MessageEmbed } from "discord.js";
import { Draft, Player } from "../models";
import { basisEmbed } from "../utils/constants";

export default class DraftEmbedGenerator {
    private _draft: Draft;

    constructor(draft: Draft) {
        this._draft = draft;
    }

    private generateGlobalInfoEmbed(): MessageEmbed {
        const streamerList = this._draft.streamers
            .map((s) => `<@${s.discordId}> (💰 ${s.balance})`)
            .join("\n");
        const streamerValue = streamerList.length > 0 ? streamerList : "Aucun streamer"

        return basisEmbed()
            .setTitle(`📋 Draft: ${this._draft.name}`)
            .addFields(
                { name: "Nom", value: this._draft.name, inline: true },
                { name: "Breakdown", value: this._draft.breakDown ?? "Non défini", inline: true },
                { name: "Status", value: this._draft.status, inline: true },
                { name: "Streamers", value: streamerValue, inline: true }
            );
    }

    private generateTeamsEmbed(): MessageEmbed {
        const generatePlayerString = (p: Player) => `${p.name} (TH${p.townHallLevel})`;
        const embed = basisEmbed().setTitle("👥 Composition des équipes");

        for (const streamer of this._draft.streamers) {
            const players = streamer.players ?? [];
            const playersListValue = players.map(generatePlayerString).join("\n")
            const value = players.length > 0 ? playersListValue : "Aucun joueur";
            embed.addFields({
                name: streamer.username || 'NC',
                value: `Streamer : <@${streamer.discordId}>\n${value}`,
                inline: false
            });
        }

        return embed
    }

    private generateNextPlayersEmbed(): MessageEmbed {
        const generateNextPlayerDescriptionSegment = (p: Player) => `${p.name} (TH${p.townHallLevel})`;

        const remainingPlayers = this._draft.players.filter((p) => !p.isSold);
        const nextPlayerList = remainingPlayers.map(generateNextPlayerDescriptionSegment).join("\n")
        const description = remainingPlayers.length > 0 ? nextPlayerList : "Tous les joueurs ont été vendus ✅";

        return basisEmbed()
            .setTitle("⏭️ Joueurs suivants")
            .setDescription(description)
    }

    generateEmbeds(): Array<MessageEmbed> {
        return [
            this.generateGlobalInfoEmbed(),
            this.generateTeamsEmbed(),
            this.generateNextPlayersEmbed()
        ]
    }
}