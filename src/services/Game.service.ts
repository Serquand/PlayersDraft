// TODO: Faire l'assignement random
// TODO: Handle _remainingPlayersByStreamerId
// TODO: Supprimer l'argent d'un streamer à la fin de l'enchère
// TODO: Générer une méthode pour check l'aléatoire ici

import { Message, MessageEmbed, MessagePayload, TextChannel } from "discord.js";
import { Draft, Player, Streamer } from "../models";
import { DraftStatus } from "../utils/Interfaces";
import { MessageOptions } from "child_process";
import { sleep } from "../utils/common";

export class Game {
    private _draft: Draft;
    private _channelId: string;
    private _players: Array<Player>;
    private _streamers: Array<Streamer>;
    private timer?: NodeJS.Timeout;
    private currentPlayerIndex: number = 0;
    private currentBid: number = 0;
    private currentBidder?: Streamer;
    private _channel: TextChannel;
    private _remainingPlayersByStreamerId: Record<string, Record<string, number>>
    private currentEmbedMessage?: Message;

    private currentAuctionStartTime?: number;
    private currentAuctionDuration?: number;

    constructor(draft: Draft, channel: TextChannel) {
        this._channel = channel
        this._channelId = channel.id;
        this._draft = draft;
        this._players = draft.players;
        this._streamers = draft.streamers;
        this._remainingPlayersByStreamerId = {}
    }

    async log(message: any) {
        return await this._channel.send(message);
    }

    launchDraft() {
        this.currentPlayerIndex = 0;
        this.startNextAuction();
    }

    private endDraft() {
        this.log("Draft terminée ✅");

        delete games[this._channelId]; // Supprimer la draft de la liste
        this._draft.status = DraftStatus.COMPLETED; // Mettre à jour le statut de la draft
        // TODO: Sauvegarder la draft et ses joueurs en DB via TypeORM
    }

    private async startNextAuction() {
        if (this.currentPlayerIndex >= this._players.length) {
            this.endDraft();
            return;
        }

        // Initialise les valeurs globales
        const player = this._players[this.currentPlayerIndex];
        this.currentBid = player.basePrice;
        this.currentBidder = undefined;

        // Initialisation de l'enchère
        this.currentAuctionStartTime = Date.now();
        this.currentAuctionDuration = player.basisTime;

        // Generate and send embed
        const embed = this.generateEmbedForPlayer();
        this.currentEmbedMessage = await this.log({ embeds: [embed] });

        this.scheduleAuctionEnd();
    }

    private scheduleAuctionEnd() {
        if (!this.currentAuctionStartTime || !this.currentAuctionDuration) return;

        const endTime = this.currentAuctionStartTime + this.currentAuctionDuration * 1000;
        const remaining = endTime - Date.now();

        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.endAuction(), remaining);
    }

    private assignPlayerToRandomStreamer() {

    }

    private async endAuction() {
        const player = this._players[this.currentPlayerIndex];

        if (!this.currentBidder) {
            player.finalPrice = 0;
            this.currentBid = 0;
            this.currentBidder = this._streamers[0] // TODO: Générer une méthode pour check l'aléatoire ici
            this.assignPlayerToRandomStreamer()
        }

        player.finalPrice = this.currentBid;
        player.streamer = this.currentBidder;
        player.isSold = true;

        this.currentBidder.players.push(player)
        this.currentBidder.balance -= this.currentBid;

        const embed = this.generateEmbedForPlayer(Math.floor(Date.now() / 1_000), "Terminé");
        this.currentEmbedMessage!.edit({ embeds: [embed] })

        await sleep(2) // Wait 2 seconds
        await this.currentEmbedMessage!.delete()

        this.currentPlayerIndex++;
        this.startNextAuction();
    }

    generateEmbedForPlayer(
        endTime?: number,
        status: 'Terminé' | 'En cours' = 'En cours'
    ): MessageEmbed {
        const basisEndTime = Math.floor((this.currentAuctionStartTime ?? 0 + (this.currentAuctionDuration ?? 0) * 1_000) / 1_000);
        const realEndTime = endTime ?? basisEndTime;
        const player = this._players[this.currentPlayerIndex];

        return new MessageEmbed()
            .setColor('DARK_RED')
            .setThumbnail("https://www.coupedesregions.com/logo-cdr.png")
            .setTitle(`Enchère pour le joueur : ${player.name} ${player.townHallLevel ? `(TH ${player.townHallLevel})` : ''}`)
            .setFields(
                { name: "Status", value: status, inline: true },
                { name: "Fin de l'enchère", value: `<t:${realEndTime}:R>`, inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: "Montant actuel", value: `${this.currentBid}`, inline: true },
                { name: "Enchéreur", value: this.currentBidder ? this.currentBidder.username : 'Aucun', inline: true },
            )
    }

    handleMessage(message: Message) {
        const content = message.content.trim();

        // Vérifie que l’auteur est un streamer autorisé
        const streamer = this._streamers.find(s => s.discordId === message.author.id);
        if (!streamer) return;

        // Vérifie si c'est une enchère valide (nombre)
        const bid = parseInt(content, 10);
        if (isNaN(bid)) {
            message.delete();
            return;
        }

        // Vérifie que le joueur existe bien et qu'il n'est pas encore sold
        const player = this._players[this.currentPlayerIndex];
        if (!player || player.isSold) {
            message.delete();
        };

        // Vérifie que la mise est bien supérieure à l'ancienne mise et inférieure à la wallet du streamer
        if (bid > this.currentBid && bid < streamer.balance) {
            // Assigne les nouvelles informations pour le tarif et l'acquéreur
            this.currentBid = bid;
            this.currentBidder = streamer;

            // Ajoute le temps d'incrément si besoin
            // Ajout du temps d'incrément
            if (this.currentAuctionDuration) {
                this.currentAuctionDuration += player.incrementTime;
            }

            this.scheduleAuctionEnd();
        }
        message.delete();
    }
}

const games: Record<string, Game> = {};
export default games;
