import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from './entities/section.entity';
import { Teacher } from 'src/teacher/entities/teacher.entity';
import { Classroom } from 'src/classroom/entities/classroom.entity';
import { Period } from 'src/period/entities/period.entity';
import { Class } from 'src/class/entities/class.entity';
import { Tuition } from 'src/tuition/entities/tuition.entity';
import { StatePeriod } from 'src/state-period/entities/state-period.entity';
import { Career } from 'src/career/entities/career.entity';
import { RegionalCenter } from 'src/regional-center/entities/regional-center.entity';
import { Student } from 'src/student/entities/student.entity';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  controllers: [SectionController],
  providers: [SectionService],
  imports: [
    TypeOrmModule.forFeature([
      Section,
      Teacher,
      Classroom,
      Period,
      Class,
      Tuition,
      StatePeriod,
      Career,
      RegionalCenter,
      Student,
    ]),
    SharedModule,
  ],
})
export class SectionModule {}
