import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Player } from "./Players";
import { Streamer } from "./Streamer";
import { DraftStatus } from "../utils/Interfaces";

@Entity({ name: 'Drafts' })
export class Draft {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true, type: 'varchar' })
    breakDown!: string | null;

    @Column({ unique: true })
    name!: string;

    @OneToMany(() => Player, player => player.draft)
    players!: Player[];

    @Column({ type: 'int' })
    basisMoneyPerStreamer!: number;

    @OneToMany(() => Streamer, streamer => streamer.draft)
    streamers!: Streamer[];

    @Column({
        type: 'enum',
        enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
        default: 'NOT_STARTED'
    })
    status!: DraftStatus;

    @Column({ type: 'varchar', nullable: true })
    channelId!: string | null;
}
