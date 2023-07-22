import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Not, Repository } from 'typeorm';
import { LoginUserDto } from './dto/login-user.dto';
import { SendEmailService } from 'src/shared/send-email/send-email.service';
import { EncryptPasswordService } from 'src/shared/encrypt-password/encrypt-password.service';
import { GenerateEmployeeNumberService } from 'src/shared/generte-employee-number/generate-employee-number.service';
import { GenerateEmailService } from 'src/shared/generate-email/generate-email.service';
import { Teacher } from 'src/teacher/entities/teacher.entity';

@Injectable()
export class UserService {

  private readonly logger = new Logger('userLogger');

  constructor(

    private readonly sendEmailService: SendEmailService,
    private readonly encryptService: EncryptPasswordService,
    private readonly generateEmployeeNumberService: GenerateEmployeeNumberService,
    private readonly generateEmailService: GenerateEmailService,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Teacher) private teacherRepository: Repository<Teacher>,


  ) {}

  async create({dni, email, ...others}: CreateUserDto) {
    try {
      const userExists = await this.userRepository.findOne({
        where:{dni: dni.replaceAll('-','')},
        relations:['teacher','student'],
      });

      const allTeacher = await this.teacherRepository.find({ relations: ['user'] });
      const usersWithEmployeeNumber = await this.userRepository
        .createQueryBuilder('user').select('user.dni')
        .where('user.employeeNumber IS NOT NULL').getMany();

      const allTeacherDNIs = allTeacher.map((teacher) => teacher.user.dni);
      const allUsersDni = usersWithEmployeeNumber.map(user => user.dni);

      const arrayDniEmployeeNumber = [...new Set(allUsersDni.concat(allTeacherDNIs))];
      const count = arrayDniEmployeeNumber.length || 0;

      if(!userExists){
        const generatePassword = await this.encryptService.generatePassword();
        const encripPassword = await this.encryptService.encodePassword(generatePassword);
        const user = {}
        Object.assign( user, await this.userRepository.create({
          dni:dni.replaceAll('-',''),
          email: email.toLowerCase(),
          isAdmin: true,
          ...others,
          password: encripPassword,
          employeeNumber: await this.generateEmployeeNumberService.generate(Number(count))
        }));
       
        await this.userRepository.save(user);
        await this.sendEmailService.sendCreationRegister(user,generatePassword,'admin');

        return {
          statusCode: 200,
          user,
          message: this.printMessageLog("Usuario Creado Exitosamente")
        }
      }

      if(userExists.isAdmin == true){
        throw new BadRequestException('El usuario ya es un Administrador');
      }

      // const emailExists = await this.userRepository.findOne({where:{email}});
      const emailExists = await this.userRepository.findOne(
        {
          where:{
            email:email.toLowerCase(),
            dni:Not(dni.replaceAll('-',''))
          }
      });

      // console.log(emailExists);

      if(emailExists){
        throw new ConflictException('El Correo Electrónico ya esta siendo usado por otro Usuario');
      }
      

      const generatePassword = await this.encryptService.generatePassword();
      const encripPassword = await this.encryptService.encodePassword(generatePassword);
      userExists.isAdmin = true;
      userExists.email = email;
      userExists.password = encripPassword;


      if(userExists.employeeNumber === null){
        userExists.employeeNumber = (userExists.teacher) ? JSON.parse(JSON.stringify(userExists.teacher)).employeeNumber: await this.generateEmployeeNumberService.generate(Number(count));
      }

      await this.userRepository.save(userExists);

      await this.sendEmailService.sendCreationRegister(userExists,generatePassword,'admin');


      return {
        statusCode: 200,
        user: userExists,
        message: this.printMessageLog("Usuario Actualizado Exitosamente")
      }
    } catch (error) {
    
      return this.printMessageError(error);
    }
  }


  

  async login({ employeeNumber, email, password }: LoginUserDto) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          // email: await email.toLowerCase(),
          employeeNumber
        },
      });

      if (!user) {
        throw new BadRequestException('El Usuario no existe.');
      }

      const ispassword = await this.encryptService.decodePassword(password, user.password)
      if(!ispassword){
        throw new UnauthorizedException('Contraseña invalida.');
      }
      

      return {
        authenticated: true,
        user,
        statusCode: 200
      };
    } catch (error) {
      return this.printMessageError(error)
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try{
      const user = await this.userRepository.preload({
        dni:id.replaceAll('-',''),
        ...updateUserDto
      })

      if(!user){
        throw new NotFoundException('El Administrador no se ha encontrado.');
      }

      await this.userRepository.save(user)

      return {
        statusCode: 200,
        user,
        message: this.printMessageLog("El Usuario se ha Actualizado Exitosamente")
      }
    }
    catch (error){
      return this.printMessageError(error)
    }
  }


  
  findAll() {
    return `Esta opción retorna todos los usuarios`;
  }


  findOne(id: number) {
    return `Está acción retorna al usuario con el id #${id}.`;
  }

  
  remove(id: number) {
    return `Está acción elimina al usuario con el id #${id}.`;
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
