import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Draft } from "./Draft";
import { Streamer } from "./Streamer";

@Entity({ name: 'Players' })
export class Player {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @ManyToOne(() => Draft, draft => draft.players, { onDelete: 'CASCADE' })
    draft!: Draft;

    @ManyToOne(() => Streamer, streamer => streamer.players, { nullable: true, onDelete: 'SET NULL' })
    streamer!: Streamer | null;

    @Column({ default: 0 })
    basePrice!: number;

    @Column({ default: 0 })
    finalPrice!: number;

    @Column({ default: false })
    isSold!: boolean;

    @Column()
    incrementTime!: number;

    @Column()
    basisTime!: number;

    @Column({ nullable: true, type: 'int' })
    townHallLevel!: number | undefined;
}
