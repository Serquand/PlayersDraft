import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Draft } from "./Draft";

@Entity({ name: 'Players' })
export class Player {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @ManyToOne(() => Draft, draft => draft.players, { onDelete: 'CASCADE' })
    draft!: Draft;

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
