import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Period } from './entities/period.entity';
import { In, Not, Repository } from 'typeorm';
import {
  Rol,
  StatePeriod,
} from 'src/state-period/entities/state-period.entity';
import { UpdatePeriodCancelationDto } from './dto/update-period-cancelation.dt';

@Injectable()
export class PeriodService {
  private readonly logger = new Logger('periodLogger');

  constructor(
    @InjectRepository(Period)
    private periodRepository: Repository<Period>,
    @InjectRepository(StatePeriod)
    private statePeriodRepository: Repository<StatePeriod>,
  ) {}

  async create(createPeriodDto: CreatePeriodDto) {
    try {
      const statePeriod = await this.statePeriodRepository.findOne({
        where: { id: createPeriodDto.idStatePeriod.id },
      });

      if (!statePeriod) {
        throw new NotFoundException(
          'El Estado del periodo proporcionado no fue encontrado',
        );
      }

      const planificationState = await this.statePeriodRepository.findOne({
        where: { name: Rol.PLANIFICATION },
      });

      const registrationState = await this.statePeriodRepository.findOne({
        where: { name: Rol.REGISTRATION },
      });

      const ongoingState = await this.statePeriodRepository.findOne({
        where: { name: Rol.ONGOING },
      });

      const gradesState = await this.statePeriodRepository.findOne({
        where: { name: Rol.GRADES },
      });

      if (+createPeriodDto.idStatePeriod == planificationState.id) {
        const existingPeriodsOnPlanification = await this.periodRepository.find(
          {
            where: { idStatePeriod: { id: planificationState.id } },
          },
        );

        if (existingPeriodsOnPlanification.length > 0) {
          throw new NotFoundException(
            'Ya existe un periodo en estado de Planificacion',
          );
        }
      }

      if (+createPeriodDto.idStatePeriod == registrationState.id) {
        const existingPeriodsOnRegistration = await this.periodRepository.find({
          where: { idStatePeriod: { id: registrationState.id } },
        });

        if (existingPeriodsOnRegistration.length > 0) {
          throw new NotFoundException(
            'Ya existe un periodo en estado de Matricula',
          );
        }
      }

      if (+createPeriodDto.idStatePeriod == ongoingState.id) {
        const existingPeriodsOngoing = await this.periodRepository.find({
          where: { idStatePeriod: { id: ongoingState.id } },
        });

        if (existingPeriodsOngoing.length > 0) {
          throw new NotFoundException(
            'Ya existe un periodo en estado En Curso',
          );
        }
      }

      if (+createPeriodDto.idStatePeriod == gradesState.id) {
        const existingPeriodsOnGrades = await this.periodRepository.find({
          where: { idStatePeriod: { id: gradesState.id } },
        });

        if (existingPeriodsOnGrades.length > 0) {
          throw new NotFoundException(
            'Ya existe un periodo en estado en Ingreso de notas',
          );
        }
      }

      const periodAlreadyExits = await this.periodRepository.findOne({
        where: {
          year: createPeriodDto.year,
          numberPeriod: createPeriodDto.numberPeriod,
        },
      });

      if (periodAlreadyExits) {
        throw new NotFoundException('El periodo ya existe.');
      }

      const period = await this.periodRepository.create({
        idStatePeriod: createPeriodDto.idStatePeriod,
        numberPeriod: createPeriodDto.numberPeriod,
        replacementPaymentDate: createPeriodDto.replacementPaymentDate,
        exceptionalCancellationDate:
          createPeriodDto.exceptionalCancellationDate,
        year: createPeriodDto.year,
      });

      const newPeriod = JSON.parse(
        JSON.stringify(await this.periodRepository.save(period)),
      );

      return {
        statusCode: 200,
        message: this.printMessageLog('El periodo ha sido creado exitosamente'),
        newPeriod,
      };
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  async findAll() {
    try {
      const periods = await this.periodRepository.find({
        relations: ['idStatePeriod'],
      });
      return {
        statusCode: 200,
        message: 'Todos los periodos han sido devueltos exitosamente',
        periods,
      };
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  async findOne(id: number) {
    try {
      const period = await this.periodRepository.findOne({
        where: { id: id },
        relations: ['idStatePeriod'],
      });
      if (!period) {
        return {
          statusCode: 404,
          message: 'Periodo no encontrado',
        };
      }
      return {
        statusCode: 200,
        message: 'Periodo devuelto exitosamente.',
        period,
      };
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  async findByYear(id: number) {
    try {
      const periods = await this.periodRepository.find({
        where: { year: id },
        relations: ['idStatePeriod'],
      });

      return {
        statusCode: 200,
        message: `Periodos del ${id} devueltos exitosamente.`,
        periods,
      };
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  async update(id: number, updatePeriodDto: UpdatePeriodDto) {
    try {
      const period = await this.periodRepository.findOne({
        where: { id: id },
        relations: ['idStatePeriod'],
      });
      if (!period) {
        throw new NotFoundException('Periodo no encontrado');
      }

      const definningState = await this.statePeriodRepository.findOne({
        where: { name: Rol.DEFINNING },
      });

      const planificationState = await this.statePeriodRepository.findOne({
        where: { name: Rol.PLANIFICATION },
      });

      const registrationState = await this.statePeriodRepository.findOne({
        where: { name: Rol.REGISTRATION },
      });

      const ongoingState = await this.statePeriodRepository.findOne({
        where: { name: Rol.ONGOING },
      });

      const gradesState = await this.statePeriodRepository.findOne({
        where: { name: Rol.GRADES },
      });

      const finishedState = await this.statePeriodRepository.findOne({
        where: { name: Rol.FINISHED },
      });

      if (period.idStatePeriod.id == finishedState.id) {
        throw new NotFoundException(
          'No se puede modificar un periodo que ya ha finalizado',
        );
      }

      if (
        period.idStatePeriod.id == definningState.id &&
        +updatePeriodDto.idStatePeriod !== planificationState.id
      ) {
        throw new NotFoundException(
          'Un periodo en estado Por Definir debe ser actualizado a Planificacion',
        );
      }

      if (
        period.idStatePeriod.id == planificationState.id &&
        +updatePeriodDto.idStatePeriod !== registrationState.id
      ) {
        throw new NotFoundException(
          'Un periodo en estado Planificacion debe ser actualizado a Matricula',
        );
      }

      if (
        period.idStatePeriod.id == registrationState.id &&
        +updatePeriodDto.idStatePeriod !== ongoingState.id
      ) {
        throw new NotFoundException(
          'Un periodo en estado Matricula debe ser actualizado a En curso',
        );
      }

      if (
        period.idStatePeriod.id == ongoingState.id &&
        +updatePeriodDto.idStatePeriod !== gradesState.id
      ) {
        throw new NotFoundException(
          'Un periodo en estado En curso debe ser actualizado a Ingreso de notas',
        );
      }

      if (
        period.idStatePeriod.id == gradesState.id &&
        +updatePeriodDto.idStatePeriod !== finishedState.id
      ) {
        throw new NotFoundException(
          'Un periodo en estado Ingreso de notas debe ser actualizado a Finalizado',
        );
      }

      if (+updatePeriodDto.idStatePeriod == planificationState.id) {
        const existingPeriodsOnPlanification = await this.periodRepository.find(
          {
            where: { idStatePeriod: { id: planificationState.id } },
          },
        );

        if (existingPeriodsOnPlanification.length > 0) {
          throw new NotFoundException(
            'Ya existe un periodo en estado de Planificacion',
          );
        }

        if (period.numberPeriod >= 2) {
          const previousPeriod = await this.periodRepository.findOne({
            where: {
              year: period.year,
              numberPeriod: period.numberPeriod - 1,
            },
            relations: ['idStatePeriod'],
          });

          if (
            previousPeriod.idStatePeriod.id != ongoingState.id &&
            previousPeriod.idStatePeriod.id != gradesState.id &&
            previousPeriod.idStatePeriod.id != finishedState.id
          ) {
            throw new NotFoundException(
              'El periodo anterior debe estar en Curso, Ingreso de notas o Finalizado',
            );
          }
        }

        const existingPeriodsOnDifferentThanRegistration =
          await this.periodRepository.find({
            where: {
              id: Not(period.id),
              idStatePeriod: Not(
                In([
                  definningState.id,
                  ongoingState.id,
                  gradesState.id,
                  finishedState.id,
                ]),
              ),
            },
          });

        if (existingPeriodsOnDifferentThanRegistration.length > 0) {
          throw new NotFoundException(
            'No puede haber un periodo en planificacion si existe un periodo en matricula',
          );
        }
      }

      if (+updatePeriodDto.idStatePeriod == registrationState.id) {
        const existingPeriodsOnRegistration = await this.periodRepository.find({
          where: { idStatePeriod: { id: registrationState.id } },
        });

        if (existingPeriodsOnRegistration.length > 0) {
          throw new NotFoundException(
            'Ya existe un periodo en estado de Matricula',
          );
        }

        const existingPeriodsOnDifferentThanFinishedDefinning =
          await this.periodRepository.find({
            where: {
              id: Not(period.id),
              idStatePeriod: Not(In([finishedState.id, definningState.id])),
            },
          });

        if (existingPeriodsOnDifferentThanFinishedDefinning.length > 0) {
          throw new NotFoundException(
            'Todos los periodos deben de estar en finalizados o por definir',
          );
        }
      }

      if (+updatePeriodDto.idStatePeriod == ongoingState.id) {
        const existingPeriodsOngoing = await this.periodRepository.find({
          where: { idStatePeriod: { id: ongoingState.id } },
        });

        if (existingPeriodsOngoing.length > 0) {
          throw new NotFoundException(
            'Ya existe un periodo en estado En Curso',
          );
        }

        const existingPeriodsOnDifferentThanGoing =
          await this.periodRepository.find({
            where: {
              id: Not(period.id),
              idStatePeriod: Not(
                In([
                  finishedState.id,
                  definningState.id,
                  planificationState.id,
                ]),
              ),
            },
          });

        if (existingPeriodsOnDifferentThanGoing.length > 0) {
          throw new NotFoundException(
            'Todos los periodos deben de estar en finalizados o por definir o planificacion',
          );
        }
      }

      if (+updatePeriodDto.idStatePeriod == gradesState.id) {
        const existingPeriodsOnGrades = await this.periodRepository.find({
          where: { idStatePeriod: { id: gradesState.id } },
        });

        if (existingPeriodsOnGrades.length > 0) {
          throw new NotFoundException(
            'Ya existe un periodo en estado en Ingreso de notas',
          );
        }
      }

      // Update only the provided fields in the DTO
      if (updatePeriodDto.replacementPaymentDate !== undefined) {
        period.replacementPaymentDate = updatePeriodDto.replacementPaymentDate;
      }

      if (updatePeriodDto.exceptionalCancellationDate !== undefined) {
        period.exceptionalCancellationDate =
          updatePeriodDto.exceptionalCancellationDate;
      }

      if (updatePeriodDto.idStatePeriod !== undefined) {
        const statePeriod = await this.statePeriodRepository.findOne({
          where: { id: updatePeriodDto.idStatePeriod.id },
        });

        if (!statePeriod) {
          throw new NotFoundException(
            'El Estado del periodo proporcionado no fue encontrado',
          );
        }
        period.idStatePeriod = updatePeriodDto.idStatePeriod;
      }

      const updatedPeriod = await this.periodRepository.save(period);

      const periodWithState = await this.periodRepository.find({
        where: { id: updatedPeriod.id },
        relations: ['idStatePeriod'],
      });

      return {
        statusCode: 200,
        message: 'Periodo actualizado exitosamente',
        updatedPeriod: periodWithState,
      };
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  async updateCancelations(
    id: number,
    updatePeriodDto: UpdatePeriodCancelationDto,
  ) {
    try {
      const period = await this.periodRepository.findOne({
        where: { id: id },
        relations: ['idStatePeriod'],
      });
      if (!period) {
        throw new NotFoundException('Periodo no encontrado');
      }

      const ongoingState = await this.statePeriodRepository.findOne({
        where: { name: Rol.ONGOING },
      });

      if (period.idStatePeriod.id != ongoingState.id) {
        throw new NotFoundException(
          'El periodo debe estar en estado de En curso',
        );
      }

      const startDate = new Date(updatePeriodDto.exceptionalCancelationStarts);

      const endDate = new Date(updatePeriodDto.exceptionalCancelationEnds);

      if (startDate >= endDate) {
        throw new NotFoundException(
          'La fecha de inicio no puede ser mayor a la fecha final',
        );
      }

      period.exceptionalCancelationStarts = startDate;
      period.exceptionalCancelationEnds = endDate;

      const updatedPeriod = await this.periodRepository.save(period);

      const periodWithState = await this.periodRepository.findOne({
        where: { id: updatedPeriod.id },
        relations: ['idStatePeriod'],
      });

      return {
        statusCode: 200,
        message: 'Periodo actualizado exitosamente devolviendo fechas',
        updatedPeriod: periodWithState,
      };
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} period`;
  }

  printMessageLog(message) {
    this.logger.log(message);
    return message;
  }

  printMessageError(message) {
    if (message.response) {
      if (message.response.message) {
        this.logger.error(message.response.message);
        return message.response;
      }

      this.logger.error(message.response);
      return message.response;
    }

    this.logger.error(message);
    return message;
  }
}
