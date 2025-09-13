import { Message } from "discord.js";
import { Draft, Player, Streamer } from "../models";

export class Game {
    private _draft: Draft;
    private _players: Array<Player>;
    private _streamers: Array<Streamer>;
    private

    constructor(draft: Draft) {
        this._draft = draft;
        this._players = draft.players;
        this._streamers = draft.streamers;
    }

    launchDraft() {
        // TODO: Logic to launch the draft
    }

    handleMessage(message: Message) {
        console.log(message.content);
        message.react('✅');
    }
}

const games: Record<string, Game> = {};
export default games;