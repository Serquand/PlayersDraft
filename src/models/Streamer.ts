import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Draft } from "./Draft";
import { Player } from "./Players";

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

    @OneToMany(() => Player, player => player.streamer, { cascade: true })
    players!: Player[];

    @ManyToOne(() => Draft, draft => draft.streamers, { onDelete: 'CASCADE' })
    draft!: Draft;
}
