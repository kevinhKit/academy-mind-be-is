import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateCenterCareerDto } from './dto/create-center-career.dto';
import { UpdateCenterCareerDto } from './dto/update-center-career.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Career } from 'src/career/entities/career.entity';
import { Repository } from 'typeorm';
import { RegionalCenter } from 'src/regional-center/entities/regional-center.entity';
import { CenterCareer } from './entities/center-career.entity';
import { json } from 'node:stream/consumers';

@Injectable()
export class CenterCareerService {
  private readonly logger = new Logger('careerLogger');

  constructor(
    @InjectRepository(CenterCareer)
    private centerCareerRepository: Repository<CenterCareer>,
  ) {}

  async create({ idCareer, idCenter }: CreateCenterCareerDto) {
    try {
      const careerExists = await this.centerCareerRepository.findOne({
        where: {
          career: {
            id: idCareer.toUpperCase(),
          },
          regionalCenter: {
            id: idCenter.toUpperCase(),
          },
          status: true,
        },
      });

      if (careerExists) {
        throw new NotFoundException(
          'La Carrera ya existe en este Centro Regional',
        );
      }

      const centerCareer = await this.centerCareerRepository.create({
        career: { id: idCareer.toUpperCase() },
        regionalCenter: { id: idCenter.toUpperCase() },
        // idCenterCareer:'d'
      });

      const newCenterCareer = JSON.parse(
        JSON.stringify(await this.centerCareerRepository.save(centerCareer)),
      );
      newCenterCareer.career = newCenterCareer.career.id;
      newCenterCareer.regionalCenter = newCenterCareer.regionalCenter.id;

      return {
        statusCode: 200,
        message: this.printMessageLog('La Carrera se ha agregado exitosamente'),
        centerCareer: newCenterCareer,
      };
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  async findAll() {
    try {
      const allCenterCareers = await this.centerCareerRepository.find({
        relations: ['career', 'regionalCenter'],
      });

      const centerCareersByRegionalCenter = allCenterCareers.reduce(
        (result, centerCareer) => {
          const { regionalCenter, career } = centerCareer;
          const regionalCenterId = regionalCenter.id;

          if (!result[regionalCenterId]) {
            result[regionalCenterId] = {
              ...regionalCenter,
              careers: [],
            };
          }

          result[regionalCenterId].careers.push(career);
          return result;
        },
        {},
      );

      const response = Object.values(centerCareersByRegionalCenter);

      return {
        statusCode: 200,
        message: this.printMessageLog(
          'Todas los centros regionales han sido obtenidas con sus respectivas carreras exitosamente',
        ),
        centerCareers: response,
      };
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  async findOne(id: RegionalCenter) {
    let regionalCenterId = `${id}`;
    regionalCenterId = regionalCenterId.toUpperCase();
    try {
      const careersCenter = await this.centerCareerRepository.find({
        where: { regionalCenter: { id: regionalCenterId } },
        relations: ['regionalCenter', 'career'],
      });

      const centerCareersByRegionalCenter = careersCenter.reduce(
        (result, centerCareer) => {
          const { regionalCenter, career } = centerCareer;
          const regionalCenterId = regionalCenter.id;

          if (!result[regionalCenterId]) {
            result[regionalCenterId] = {
              ...regionalCenter,
              careers: [],
            };
          }

          result[regionalCenterId].careers.push(career);
          return result;
        },
        {},
      );

      return {
        statusCode: 200,
        message: this.printMessageLog(
          'Todas las carreras del centro regional han sido devueltas exitosamente',
        ),
        careersCenter: centerCareersByRegionalCenter,
      };
    } catch (error) {
      return this.printMessageError(error);
    }
  }

  update(id: number, updateCenterCareerDto: UpdateCenterCareerDto) {
    return `This action updates a #${id} centerCareer`;
  }

  remove(id: number) {
    return `This action removes a #${id} centerCareer`;
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
