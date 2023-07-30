import { Section } from 'src/section/entities/section.entity';
import { StatePeriod } from 'src/state-period/entities/state-period.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum numberPeriodOptions {
  first = 1,
  second = 2,
  third = 3,
}

@Entity('Period')
export class Period {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('smallint', {
    default: new Date().getFullYear(),
    nullable: false,
  })
  year: number;

  @Column({
    type: 'enum',
    enum: numberPeriodOptions,
    nullable: false,
  })
  numberPeriod: number;

  @Column('boolean', {
    default: false,
  })
  replacementPaymentDate: boolean;

  @Column('boolean', {
    default: false,
  })
  exceptionalCancellationDate: boolean;

  // @Column('smallint')
  // status: number;

  @ManyToOne(() => StatePeriod, (statePeriod) => statePeriod.period)
  @JoinColumn({
    name: 'idStatePeriod',
  })
  idStatePeriod: StatePeriod;

  @OneToMany(() => Section, (section) => section.idPeriod)
  section: Section;
}
