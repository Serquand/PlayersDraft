// TODO: Faire l'assignement random
// TODO: Handle _remainingPlayersByStreamerId

import { Message, MessageEmbed, MessageOptions, TextChannel } from "discord.js";
import { Draft, Player, Streamer } from "../models";
import { DraftStatus } from "../utils/Interfaces";
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

    async log(message: MessageOptions | string) {
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

    private computeEndTime(): number {
        return this.currentAuctionStartTime! + this.currentAuctionDuration! * 1000;
    }

    private computeRemainingTime(): number {
        return this.computeEndTime() - Date.now();
    }

    private scheduleAuctionEnd(remainingTime?: number) {
        if (!this.currentAuctionStartTime || !this.currentAuctionDuration) return;

        const localRemainingTime = remainingTime ?? this.computeRemainingTime()
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.endAuction(), localRemainingTime);
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

        // Update the embed for informing the streamers about the sell
        const embed = this.generateEmbedForPlayer(Math.floor(Date.now() / 1_000), "Terminé");
        this.currentEmbedMessage!.edit({ embeds: [embed] })

        // Log the action and then remove all trace
        const logMessage = await this.log(`✅ Le joueur ${player.name} a été acheté par <@${this.currentBidder.discordId}> pour ${this.currentBid}`)
        await sleep(3)
        await Promise.all([logMessage.delete(), this.currentEmbedMessage!.delete()])

        // Go to the next player
        this.currentPlayerIndex++;
        this.startNextAuction();
    }

    generateEmbedForPlayer(
        endTime?: number,
        status: 'Terminé' | 'En cours' = 'En cours'
    ): MessageEmbed {
        const basisEndTime = Math.floor(((this.currentAuctionStartTime ?? 0) + (this.currentAuctionDuration ?? 0) * 1000) / 1_000);
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
                { name: "Enchéreur", value: this.currentBidder ? `<@${this.currentBidder.discordId}>` : 'Aucun', inline: true },
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

            const remainingTime = this.computeRemainingTime()
            let embed: MessageEmbed | undefined;

            // Ajout de l'incrément si le temps restant est inférieur à l'incrément
            if (remainingTime < player.incrementTime * 1_000) {
                this.scheduleAuctionEnd(player.incrementTime * 1_000)
                embed = this.generateEmbedForPlayer(Math.ceil(Date.now() / 1_000) + player.incrementTime)
            } else {
                embed = this.generateEmbedForPlayer()
            }

            this.currentEmbedMessage!.edit({ embeds: [embed] })
        }
        message.delete();
    }
}

const games: Record<string, Game> = {};
export default games;
