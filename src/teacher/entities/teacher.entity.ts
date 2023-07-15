import { Role } from 'src/role/entities/role.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

@Entity('Teacher')
export class Teacher {
  @PrimaryColumn('text',{
    unique: true
  })
  employeeNumber: string;

  @Column('text',{
    unique: true
  })
  institutionalEmail: string;

  @Column('text',{
    unique: true
  })
  email: string;

  @Column('text')
  password: string;

  @Column('text', {
    nullable: true,
  })
  video: string;

  @Column('text', {
    nullable: true,
  })
  photoOne: string;

  @Column('text', {
    nullable: true,
  })
  description: string;

   @Column('timestamp',{
    default: () => "current_timestamp"
  })
  create_at: Date;

  @Column({
    type: 'boolean',
    default: true
  })
  status: boolean

  @Column({ type: 'boolean',
    name: 'isBoss',
    default: false,
  })
  isBoss: boolean;

  @Column({
    type: 'boolean',
    default: false })
  isCoordinator: boolean;

  @OneToOne(() => User, (user) => user.teacher)
  @JoinColumn({
    name: 'idUser',
  })
  user: User;
}
