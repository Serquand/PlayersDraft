import { Repository } from "typeorm";
import { Draft } from "../models/Draft";
import { AppDataSource } from "../database";
import { AutocompleteInteraction } from "discord.js";
import { sendAutocomplete } from "../utils/autocomplete";
import { INumberOfPlayers } from "../utils/Interfaces";

class DraftService {
    private readonly draftRepository: Repository<Draft>;

    constructor() {
        this.draftRepository = AppDataSource.getRepository(Draft);
    }

    async registerDraft(draftToSave: Partial<Draft>): Promise<Draft> {
        try {
            return await this.draftRepository.save(draftToSave);
        } catch (error) {
            console.error("Error registering draft:", error);
            throw error;
        }
    }

    async listDraft() {
        return this.draftRepository.find();
    }

    async getDraftByName(name: string, relations: (keyof Draft)[] = []): Promise<Draft | null> {
        return this.draftRepository.findOne({ where: { name }, relations });
    }

    getNumberOfPlayerForDraft(draft: Draft): INumberOfPlayers | null {
        const breakdown = draft.breakDown;
        if (!draft.streamers?.length) return null;
        if (!breakdown) return { total: 0, byTownHalls: [] };

        const byTownHalls = breakdown.split('/');
        const userByTownHalls = []

        let counter = 0;
        for(const th of byTownHalls) {
            counter += Number.parseInt(th)
            userByTownHalls.push(Number.parseInt(th) * draft.streamers.length);
        }

        return {
            total: counter * draft.streamers.length,
            byTownHalls: userByTownHalls
        }
    }

    checkIfNumberOfPlayersIsValid(draft: Draft, data: Array<any>): boolean {
        const numberOfPlayers = this.getNumberOfPlayerForDraft(draft);
        if (!numberOfPlayers) return false;

        if (!draft.breakDown) {
            return data.length % draft.streamers.length === 0;
        }

        const actualNumberOfPlayers = data.length;
        if(actualNumberOfPlayers !== numberOfPlayers.total) {
            return false;
        }

        const townHallCount: Record<number, number> = {};
        let minimalTH = 1;
        for (const player of data) {
            const th = player.TownHallLevel;
            if (typeof th !== 'number' || !Number.isInteger(th) || th <= 0) {
                return false;
            }
            if (th > minimalTH) minimalTH = th;
            townHallCount[th] = (townHallCount[th] || 0) + 1;
        }

        for (let i = 0; i < numberOfPlayers.byTownHalls.length; i++) {
            const expectedCount = numberOfPlayers.byTownHalls[i];
            const actualCount = townHallCount[i + minimalTH] || 0;
            if (expectedCount !== actualCount) {
                return false;
            }
        }

        return true;
    }

    async deleteDraftByName(name: string): Promise<void> {
        await this.draftRepository.delete({ name });
    }

    async autocompleteDraft(interaction: AutocompleteInteraction) {
        const draftNames = (await this.listDraft()).map(d => d.name);
        return sendAutocomplete(interaction, draftNames);
    }
}

export default new DraftService();