import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Player } from "./Players";
import { Streamer } from "./Streamer";

@Entity({ name: 'Drafts' })
export class Draft {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @OneToMany(() => Player, player => player.draft)
    players!: Player[];

    @OneToMany(() => Streamer, streamer => streamer.draft)
    streamers!: Streamer[];

    @Column({ default: false })
    isActive!: boolean;

    @Column({ type: 'varchar', nullable: true })
    channelId!: string | null;
}
