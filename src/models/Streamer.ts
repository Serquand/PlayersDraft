import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Draft } from "./Draft";

@Entity({ name: 'Streamers' })
export class Streamer {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    username!: string;

    @Column()
    discordId!: string;

    @Column({ nullable: false })
    balance!: number;

    @ManyToOne(() => Draft, draft => draft.streamers)
    draft!: Draft;
}
