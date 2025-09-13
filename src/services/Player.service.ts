import { Repository } from "typeorm";
import { AppDataSource } from "../database";
import { Player } from "../models/Players";
import { Draft } from "../models/Draft";

class PlayerService {
    private readonly playerRepository: Repository<Player>;

    constructor() {
        this.playerRepository = AppDataSource.getRepository(Player);
    }

    async clearPlayersFromDraft(draft: Draft): Promise<void> {
        await this.playerRepository.delete({ draft });
    }

    async bulkCreate(players: Array<Partial<Player>>): Promise<void> {
        const playerEntities = this.playerRepository.create(players);
        await this.playerRepository.save(playerEntities);
    }
}

export default new PlayerService();