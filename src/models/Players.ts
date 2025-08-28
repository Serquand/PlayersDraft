import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Draft } from "./Draft";

@Entity({ name: 'Players' })
export class Player {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @ManyToOne(() => Draft, draft => draft.players)
    draft!: Draft;

    @Column({ default: 0 })
    price!: number;

    @Column()
    incrementTime!: number;

    @Column()
    basisTime!: number;
}
