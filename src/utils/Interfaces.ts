export enum DraftStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED'
}

export interface INumberOfPlayers {
    total: number;
    byTownHalls: Array<number>;
}