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

    async getDraftByName(name: string, relations: string[] = []): Promise<Draft | null> {
        return this.draftRepository.findOne({ where: { name }, relations });
    }

    getTotalNumberInBreakdown(breakdown: string): number {
        return breakdown.split('/').reduce((acc, val) => acc + Number.parseInt(val), 0);
    }

    getNumberOfPlayerForDraft(draft: Draft): INumberOfPlayers | null {
        const breakdown = draft.breakDown;
        if (!draft.streamers?.length) return null;
        if (!breakdown) return { total: 0, byTownHalls: [] };

        const byTownHalls = breakdown.split('/');
        const userByTownHalls = []

        let counter = 0;
        for (const th of byTownHalls) {
            counter += Number.parseInt(th)
            userByTownHalls.push(Number.parseInt(th) * draft.streamers.length);
        }

        return {
            total: counter * draft.streamers.length,
            byTownHalls: userByTownHalls
        }
    }

    buildTownHallHistogram<T>(data: Array<T>, townHallKey: keyof T): { counts: Record<number, number>; maxTH: number } | null {
        const counts: Record<number, number> = {};
        let maxTH = 0;

        for (const p of data) {
            const th = p[townHallKey];
            if (typeof th !== "number" || !Number.isInteger(th) || th <= 0) {
                return null;
            }
            counts[th] = (counts[th] ?? 0) + 1;
            if (th > maxTH) maxTH = th;
        }

        return { counts, maxTH };
    }

    validateTownHallBreakdown(
        expectedByTownHalls: number[],
        histogram: { counts: Record<number, number>; maxTH: number }
    ): boolean {
        const { counts, maxTH } = histogram;

        for (let i = 0; i < expectedByTownHalls.length; i++) {
            const th = maxTH - i; // même logique que ton code d'origine
            const actual = counts[th] ?? 0;
            if (actual !== expectedByTownHalls[i]) return false;
        }

        return true;
    }

    checkIfNumberOfPlayersIsValid(draft: Draft, data: Array<any>): boolean {
        const numberOfPlayers = this.getNumberOfPlayerForDraft(draft);
        if (!numberOfPlayers || data.length !== numberOfPlayers.total) return false;

        const histogram = this.buildTownHallHistogram(data, "TownHallLevel");
        if (!histogram) return false;

        return this.validateTownHallBreakdown(numberOfPlayers.byTownHalls, histogram);
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