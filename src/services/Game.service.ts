import { Message, TextChannel } from "discord.js";
import { Draft, Player, Streamer } from "../models";
import { DraftStatus } from "../utils/Interfaces";

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

    // Ajouts
    private currentAuctionStartTime?: number; // ms
    private currentAuctionDuration?: number;  // secondes cumulées

    constructor(draft: Draft, channel: TextChannel) {
        this._channel = channel
        this._channelId = channel.id;
        this._draft = draft;
        this._players = draft.players;
        this._streamers = draft.streamers;
    }

    log(message: string) {
        this._channel.send(message);
    }

    launchDraft() {
        this.log(`Draft lancée avec ${this._players.length} joueurs.`);
        this.currentPlayerIndex = 0;
        this.startNextAuction();
    }

    private endDraft() {
        this.log("Draft terminée ✅");

        delete games[this._channelId]; // Supprimer la draft de la mémoire
        this._draft.status = DraftStatus.COMPLETED; // Mettre à jour le statut de la draft
        // TODO: Sauvegarder la draft et ses joueurs en DB via TypeORM
    }

    private startNextAuction() {
        if (this.currentPlayerIndex >= this._players.length) {
            this.endDraft();
            return;
        }

        const player = this._players[this.currentPlayerIndex];
        this.currentBid = player.basePrice;
        this.currentBidder = undefined;

        // Initialisation de l'enchère
        this.currentAuctionStartTime = Date.now();
        this.currentAuctionDuration = player.basisTime;

        this.log(`🟢 Enchère lancée pour ${player.name}, prix de base : ${player.basePrice}, durée : ${player.basisTime}s`);

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

    private endAuction() {
        const player = this._players[this.currentPlayerIndex];

        if (this.currentBidder) {
            player.finalPrice = this.currentBid;
            player.isSold = true;
            this.log(`✅ ${player.name} est vendu à ${this.currentBidder.username} pour ${this.currentBid}`);
        } else {
            this.assignPlayerToRandomStreamer()
            this.log(`❌ ${player.name} a été assigné à un streamer random`);
        }

        this.currentPlayerIndex++;
        this.startNextAuction();
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

        const player = this._players[this.currentPlayerIndex];
        if (!player) return;

        if (bid > this.currentBid) {
            this.currentBid = bid;
            this.currentBidder = streamer;

            // Ajout du temps d'incrément
            if (this.currentAuctionDuration) {
                this.currentAuctionDuration += player.incrementTime;
                this.log(
                    `⏱ Temps prolongé de +${player.incrementTime}s (nouvelle durée totale : ${this.currentAuctionDuration}s)`
                );
            }

            this.log(`🔼 Nouvelle enchère : ${streamer.username} mise ${bid} sur ${player.name}`);

            this.scheduleAuctionEnd();
            message.react("✅");
        } else {
            message.react("❌");
        }
    }
}

const games: Record<string, Game> = {};
export default games;
