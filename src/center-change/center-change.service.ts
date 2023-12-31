import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateCenterChangeDto } from './dto/create-center-change.dto';
import { UpdateCenterChangeDto } from './dto/update-center-change.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from 'src/student/entities/student.entity';
import { StudentCareer } from 'src/student-career/entities/student-career.entity';
import { CenterCareer } from 'src/center-career/entities/center-career.entity';
import { Repository } from 'typeorm';
import { CenterChange, applicationStatus } from './entities/center-change.entity';
import { CareerChange } from 'src/career-change/entities/career-change.entity';
import { Period } from 'src/period/entities/period.entity';
import { ReviewCenterChangeDto, applicationStatusOption } from './dto/review-center-change.dto';
import { ReviewCareerChangeDto } from 'src/career-change/dto/review-career-change.dto';

@Injectable()
export class CenterChangeService {
  
  private readonly logger = new Logger('centerChangeLogger');

  constructor(
    @InjectRepository(CenterChange) private centerChangeRepository: Repository<CenterChange>,
    @InjectRepository(CareerChange) private careerChangeRepository: Repository<CareerChange>,
    @InjectRepository(Student) private studentRepository: Repository<Student>,
    @InjectRepository(StudentCareer) private studentCareerRepository: Repository<StudentCareer>,
    @InjectRepository(CenterCareer) private centerCareerRepository: Repository<CenterCareer>,
    @InjectRepository(Period) private periodRepository: Repository<Period>,
  ){
  }

  
  async create({idCenter, justification, accountNumber, idPeriod}: CreateCenterChangeDto) {
    try {

      const periodExist = await this.periodRepository.findOne({
        where:{
          id: +idPeriod
        }
      });

      if(!periodExist){
        throw new NotFoundException('El periodo proporcionado no existe')
      }

      const centerChangeExist = await this.centerChangeRepository.findOne({
        where:{
          accountNumber: accountNumber,
          applicationStatus: applicationStatus.PROGRESS,
          idPeriod: {
            id: +idPeriod
          },
          stateRequest: true
        },
        relations: ['idPeriod']
      });

      if(centerChangeExist){
        throw new ConflictException('Usted tiene una solicitud de cambio de centro regional vigente para el periodo actual')
      }

      const centerChangePeriodExist = await this.centerChangeRepository.findOne({
        where:{
          accountNumber: accountNumber,
          idPeriod: {
            id: +idPeriod
          },
          stateRequest: true,
        },
        relations: ['idPeriod']
      });

      if(centerChangePeriodExist){
        throw new ConflictException('Usted ya realizo una solicitud de cambio de centro regional para el periodo actual')
      }


      const studentExist = JSON.parse(JSON.stringify(await this.studentRepository.findOne({
        where: {
          accountNumber: accountNumber
        },
        relations:['studentCareer','studentCareer.centerCareer','studentCareer.centerCareer.career','studentCareer.centerCareer.regionalCenter']
        // relations:['studentCareer','studentCareer.centerCareer','studentCareer.centerCareer.career']
      })))


      if(!studentExist){
        throw new NotFoundException('El estudiante enviado no existe')
      }

      const requestExist = await this.careerChangeRepository.findOne({
        where: {
          accountNumber: accountNumber,
          // applicationStatus: applicationStatus.PROGRESS,
          idPeriod: {
            id: +idPeriod
          },
          stateRequest: true
        }
      });

      if(requestExist){
        throw new ConflictException('Usted ya tiene un proceso de cambio de carrera para el periodo actual')
      }

      if(studentExist.studentCareer[0].centerCareer.regionalCenter.id == idCenter){
        throw new ConflictException('Usted ya esta inscrito en el centro regional proporcionado')
      }


      const careerCenterExist = await this.centerCareerRepository.findOne({
        where:{
          regionalCenter: {
            id: idCenter
          },
          career: {
            id: studentExist.studentCareer[0].centerCareer.career.id
          }
        }
      });

      if(!careerCenterExist){
        throw new NotFoundException('EL centro regional proporcionado no cuenta con la carrera que estudia actualmente');
      }

      const centerChange = await this.centerChangeRepository.create({
        idCenter: idCenter,
        justification: justification,
        // justificationPdf: justificationPdf,
        accountNumber: accountNumber,
        idPeriod: {
          id: +idPeriod
        },
        stateRequest: true
      });

      const savecenterChange = await this.centerChangeRepository.save(centerChange)

      return {
        statusCode: 200,
        message: this.printMessageLog("La solicitud de cambio de centro regional se ha realizado exitosamente."),
        centerChange: savecenterChange
      }


    } catch (error) {
      return this.printMessageError(error);
    }
  }

  async reviewRequest({aplicationStatus, idCenterChange}:ReviewCenterChangeDto){
    try {
      
      const statusAplication = await this.centerChangeRepository.findOne({
        where: {
          idCenterChange: idCenterChange,
          // applicationStatus: In([applicationStatusOption.ACCEPTED,applicationStatusOption.REJECTED])
          stateRequest: true,
        },
        relations: ['student','student.studentCareer','student.studentCareer.centerCareer','student.studentCareer.centerCareer.career','student.studentCareer.centerCareer.regionalCenter']
      });

      if(!statusAplication){
        throw new NotFoundException('Solicitud de cambio de centro regional no encontrada');
      }

      if(Boolean(statusAplication.accountStatement) == Boolean(false)){
        throw new ConflictException('EL estudiante no ha realizado el pago para la solicitud de cambio de centro regional');
      }

      if(statusAplication.applicationStatus == applicationStatusOption.ACCEPTED || statusAplication.applicationStatus == applicationStatusOption.REJECTED ){
        throw new ConflictException('La solicitud del estudiante ya fue revisada');
      }

      const createAplication = await this.centerChangeRepository.preload({
        idCenterChange,
        applicationStatus: aplicationStatus,
        applicationDate: new Date().toISOString(),
        stateRequest: true
      });

      if(aplicationStatus == applicationStatusOption.ACCEPTED){
        const studentChange = await JSON.parse(JSON.stringify(statusAplication));

        const centerCareer = await this.centerCareerRepository.findOne({
          where: {
            career: {
              id: studentChange.student.studentCareer[0].centerCareer.career.id
            },
            regionalCenter: {
              id: statusAplication.idCenter
            }
          }
        });

        const studentCarrer = await this.studentCareerRepository.findOne({
          where: {
            student: {
              accountNumber: studentChange.student.accountNumber
            }
          }
        });

        const newStudentCareer = await this.studentCareerRepository.preload({
          idStudentCareer: studentCarrer.idStudentCareer,
          centerCareer: {
            idCenterCareer: centerCareer.idCenterCareer
          }
        });
  
        await this.studentCareerRepository.save(newStudentCareer);
      }

      const saveAplication = await this.centerChangeRepository.save(createAplication);
      return {
        statusCode: 200,
        message: this.printMessageLog("La solicitud del estudiante se actualizo con exito."),
        aplicationRequest: saveAplication
      }
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  async findAll() {
    try {
      const allRequestStundents = await this.centerChangeRepository.find({
        relations:['student','idPeriod','student.user'],
        where: {
          stateRequest: true
        }
      });

      if(allRequestStundents.length == 0){
        throw new NotFoundException('No se han encontrado solicitudes');
      }

      return {
        statusCode: 200,
        message: this.printMessageLog("Las solicitudes se obtuvieron exitosamente."),
        allRequest: allRequestStundents
      }
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  async findAllByStudent(idStudent: string) {
    try {
      const allRequestStundents = await this.centerChangeRepository.find({
        relations:['student','idPeriod','student.user','student.studentCareer.centerCareer','student.studentCareer.centerCareer.regionalCenter','student.studentCareer.centerCareer.career'],
        where: {
          student: {
            accountNumber: idStudent
          },
          stateRequest:true
        }
      });

      if(allRequestStundents.length == 0){
        throw new NotFoundException('No se han encontrado solicitudes');
      }

      return {
        statusCode: 200,
        message: this.printMessageLog("Las solicitudes se obtuvieron exitosamente."),
        allRequest: allRequestStundents
      }
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  async findOne(id: string, career: string) {
    try {
      const allRequestStundents = await this.centerChangeRepository.find({
        relations:['student','idPeriod','student.user','student.studentCareer.centerCareer','student.studentCareer.centerCareer.regionalCenter','student.studentCareer.centerCareer.career'],
        where: {
          idCenter : id,
          student: {
            studentCareer:{
              centerCareer:{
                career:{
                  id: career.toUpperCase()
                }
              }
            }
          },
          stateRequest:true
        }
      });

      if(allRequestStundents.length == 0){
        throw new NotFoundException('No se han encontrado solicitudes');
      }

      return {
        statusCode: 200,
        message: this.printMessageLog("Las solicitudes se obtuvieron exitosamente."),
        allRequest: allRequestStundents
      }
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  update(id: number, updateCenterChangeDto: UpdateCenterChangeDto) {
    return `This action updates a #${id} centerChange`;
  }

  async remove(id: string) {
    try {
      
      const centerChangeDelete = await this.centerChangeRepository.findOne({
        where: {
          idCenterChange: id,
          stateRequest: false
        }
      });

      if(centerChangeDelete){
        throw new NotFoundException('La Solicitud ya ha sido borrada');
      }
      
      const centerChangeExist = await this.centerChangeRepository.findOne({
        where: {
          idCenterChange: id,
          stateRequest: true
        }
      });

      if(!centerChangeExist){
        throw new NotFoundException('Solicitud no encontrada');
      }

      const centerChange = await this.centerChangeRepository.preload({
        idCenterChange:id,
        stateRequest: false
      });

      await this.centerChangeRepository.save(centerChange);


      return {
        statusCode: 200,
        message: this.printMessageLog("La solicitud se ha borrado exitosamente"),
      }


    } catch (error) {
      return this.printMessageError(error);
    }
  }

  printMessageLog(message){
    this.logger.log(message);
    return message;
  }

  printMessageError(message){
    if(message.response){
      if(message.response.message){
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
