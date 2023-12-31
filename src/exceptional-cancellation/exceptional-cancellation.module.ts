import { Module } from '@nestjs/common';
import { ExceptionalCancellationService } from './exceptional-cancellation.service';
import { ExceptionalCancellationController } from './exceptional-cancellation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExceptionalCancellation } from './entities/exceptional-cancellation.entity';
import { Tuition } from 'src/tuition/entities/tuition.entity';
import { StatePeriod } from 'src/state-period/entities/state-period.entity';
import { Period } from 'src/period/entities/period.entity';
import { Student } from 'src/student/entities/student.entity';
import { Career } from 'src/career/entities/career.entity';
import { RegionalCenter } from 'src/regional-center/entities/regional-center.entity';

@Module({
  controllers: [ExceptionalCancellationController],
  providers: [ExceptionalCancellationService],
  imports: [
    TypeOrmModule.forFeature([
      ExceptionalCancellation,
      Tuition,
      StatePeriod,
      Period,
      Student,
      Career,
      RegionalCenter,
    ]),
  ],
})
export class ExceptionalCancellationModule {}
