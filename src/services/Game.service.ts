import { Message, MessageEmbed, MessageOptions, TextChannel } from "discord.js";
import { Draft, Player, Streamer } from "../models";
import { DraftStatus } from "../utils/Interfaces";
import { generateRandomNumber, sleep } from "../utils/common";
import DraftService from "./Draft.service";
import { AppDataSource } from "../database";
import { basisEmbed } from "../utils/constants";
import DraftEmbedGenerator from "./DraftEmbedGenerator.service";

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
    private _remainingPlayersByStreamerId!: Record<string, Record<string, number>>
    private currentEmbedMessage?: Message;
    private currentAuctionStartTime?: number;
    private currentAuctionDuration?: number;
    private _canBeLaunched!: boolean;
    private _draftEmbedMessage?: Message;
    private _draftEmbedGenerator: DraftEmbedGenerator

    constructor(draft: Draft, channel: TextChannel) {
        this._channel = channel
        this._channelId = channel.id;
        this._draft = draft;
        this._players = draft.players;
        this._streamers = draft.streamers;
        this._canBeLaunched = true;
        this._draftEmbedGenerator = new DraftEmbedGenerator(this._draft);
        this.computeRemainingPlayersByStreamerId();
    }

    async log(message: MessageOptions | string) {
        return await this._channel.send(message);
    }

    computeRemainingPlayersByStreamerId() {
        const histogram = DraftService.buildTownHallHistogram(this._draft.players, 'townHallLevel')
        if (!histogram) {
            return this._canBeLaunched = false;
        }

        // Construct what each streamer needs
        const playerByTh: Record<number, number> = {}
        Object.keys(histogram.counts).forEach(th => {
            const numberTh = Number(th)
            playerByTh[numberTh] = histogram.counts[numberTh] / this._draft.streamers.length
        })

        // Assign for each streamers
        const remainingPlayersByStreamerId: Record<string, Record<string, number>> = {}
        for (const streamer of this._draft.streamers) {
            remainingPlayersByStreamerId[streamer.discordId] = {...playerByTh}
        }
        this._remainingPlayersByStreamerId = remainingPlayersByStreamerId;
    }

    async launchDraft(): Promise<boolean> {
        if(!this._canBeLaunched) return false

        this._draft.status = DraftStatus.IN_PROGRESS
        this._draftEmbedMessage = await this.log({ embeds: this._draftEmbedGenerator.generateEmbeds() })
        this.currentPlayerIndex = 0;
        this.startNextAuction();
        return true
    }

    private async endDraft() {
        this._draft.status = DraftStatus.COMPLETED; // Mettre à jour le statut de la draft

        // Sauvegarder la draft, les joueurs, et les streamers
        await Promise.all([
            AppDataSource.getRepository(Draft).save(this._draft),
            AppDataSource.getRepository(Player).save(this._players),
        ])

        this._draftEmbedMessage = await this.log({ embeds: this._draftEmbedGenerator.generateEmbeds() })
        delete games[this._channelId]; // Supprimer la draft de la liste
    }

    private async startNextAuction() {
        if (this.currentPlayerIndex >= this._players.length) {
            await this.endDraft();
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

    private assignPlayerToRandomStreamer(): Streamer {
        const player = this._players[this.currentPlayerIndex];
        const thLevel = player.townHallLevel
        const eligibleStreamers: Streamer[] = [];

        for(const streamerDiscordId in this._remainingPlayersByStreamerId) {
            const streamerLeft = this._remainingPlayersByStreamerId[streamerDiscordId][thLevel]
            const streamer = this._streamers.find(s => s.discordId === streamerDiscordId)
            if (streamerLeft > 0 && streamer) {
                eligibleStreamers.push(streamer)
            }
        }

        const randomIndex = generateRandomNumber(0, eligibleStreamers.length - 1)
        return eligibleStreamers[randomIndex]
    }

    private async endAuction() {
        const player = this._players[this.currentPlayerIndex];

        if (!this.currentBidder) {
            player.finalPrice = 0;
            this.currentBid = 0;
            this.currentBidder = this.assignPlayerToRandomStreamer()
        }

        player.finalPrice = this.currentBid;
        player.streamer = this.currentBidder;
        player.isSold = true;

        this.currentBidder.players.push(player)
        this.currentBidder.balance -= this.currentBid;
        this._remainingPlayersByStreamerId[this.currentBidder.discordId][player.townHallLevel] -= 1;

        // Update the embed for informing the streamers about the sell
        const embed = this.generateEmbedForPlayer(Math.floor(Date.now() / 1_000), "Terminé");
        this.currentEmbedMessage!.edit({ embeds: [embed] })

        // Log the action and then remove all trace
        const logMessage = await this.log(`✅ Le joueur ${player.name} a été acheté par <@${this.currentBidder.discordId}> pour ${this.currentBid}`)
        this._draftEmbedMessage?.edit({ embeds: this._draftEmbedGenerator.generateEmbeds() })
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

        return basisEmbed()
            .setTitle(`Enchère pour le joueur : ${player.name} ${player.townHallLevel ? `(TH ${player.townHallLevel})` : ''}`)
            .setFields(
                { name: "Status", value: status, inline: true },
                { name: "Fin de l'enchère", value: `<t:${realEndTime}:R>`, inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: "Montant actuel", value: `${this.currentBid}`, inline: true },
                { name: "Enchéreur", value: this.currentBidder ? `<@${this.currentBidder.discordId}>` : 'Aucun', inline: true },
                { name: "<@351488690029199360>", value: 'Aucun', inline: true },
            )
    }

    private isInvalidBid(streamer?: Streamer, bid?: number, player?: Player): boolean {
        // Vérifie que l’auteur est un streamer autorisé
        // Vérifie si c'est une enchère valide (nombre)
        // Vérifie que le joueur existe bien et qu'il n'est pas encore sold
        // Vérifie que la mise est bien supérieure à l'ancienne mise et inférieure à la wallet du streamer
        // Vérifier que le streamer peut encore acheter un joueur de son niveau de TH

        return (
            !streamer ||
            isNaN(bid!) ||
            !player ||
            player.isSold ||
            bid! <= this.currentBid ||
            bid! >= streamer.balance ||
            !(this._remainingPlayersByStreamerId[streamer.discordId][player.townHallLevel] > 0)
        );
    }

    handleMessage(message: Message) {
        const content = message.content.trim();
        const player = this._players[this.currentPlayerIndex];
        const streamer = this._streamers.find(s => s.discordId === message.author.id);
        const bid = parseInt(content, 10);

        if (this.isInvalidBid(streamer, bid, player)) {
            return void message.delete();
        }

        // Assigne les nouvelles informations pour le tarif et l'acquéreur
        this.currentBid = bid;
        this.currentBidder = streamer;

        // Gestion du timer
        const remainingTime = this.computeRemainingTime();
        let extraSeconds = 0;

        if (remainingTime < player.incrementTime * 1_000) {
            extraSeconds = player.incrementTime;
            this.scheduleAuctionEnd(extraSeconds * 1_000);
        }

        // Mise à jour de l'embed
        const endTime = extraSeconds
            ? Math.ceil(Date.now() / 1_000) + extraSeconds
            : undefined;

        const embed = this.generateEmbedForPlayer(endTime);
        this.currentEmbedMessage?.edit({ embeds: [embed] });

        message.delete();
    }
}

const games: Record<string, Game> = {};
export default games;
