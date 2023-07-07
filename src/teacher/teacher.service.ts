import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { DataSource, Equal, Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { User } from 'src/user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { transporter } from 'src/utils/mailer';
import { HttpException, HttpStatus } from '@nestjs/common';
@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Teacher) private teacherRepository: Repository<Teacher>, // @InjectRepository(Teacher) // private readonly teacherRepository: Repository<Teacher>, // private readonly dataSource: DataSource,
  ) {}

  async create(createTeacherDto: CreateTeacherDto) {
    const {
      dni,
      firstName,
      secondName,
      firstLastName,
      secondLastName,
      email,
      address,
      phone,
      isBoss,
      isCoordinator,
      isTeacher,
      video,
    } = createTeacherDto;

    const newPassword = Math.random().toString(36).substring(7);
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(newPassword, salt);

    const user = this.userRepository.create({
      dni: dni,
      firstName: firstName,
      secondName: secondName,
      firstLastName: firstLastName,
      secondLastName: secondLastName,
      email: email,
      password: password,
      address: address,
      phone: phone,
    });
    const count = await this.teacherRepository.count();
    let newEmployeeNumber = '';
    if (count <= 9) {
      newEmployeeNumber = `000${count}`;
    } else if (count <= 99) {
      newEmployeeNumber = `00${count}`;
    } else if (count <= 999) {
      newEmployeeNumber = `0${count}`;
    } else {
      newEmployeeNumber = `${count}`;
    }
    let newEmail = `${firstName}.${firstLastName}@unah.edu.hn`;
    let emailExists = await this.teacherRepository.findOne({
      where: { institutionalEmail: newEmail },
    });

    while (emailExists) {
      const randomString = Math.floor(Math.random() * 99) + 1; // Generar una cadena aleatoria
      newEmail = `${firstName}.${firstLastName}.${randomString}@unah.edu.hn`;
      emailExists = await this.teacherRepository.findOne({
        where: { institutionalEmail: newEmail },
      });
    }

    const newTeacher = new Teacher();
    newTeacher.employeeNumber = newEmployeeNumber;
    newTeacher.institutionalEmail = newEmail;
    newTeacher.isBoss = isBoss;
    newTeacher.isCoordinator = isCoordinator;
    newTeacher.isTeacher = isTeacher;

    newTeacher.user = user;

    await this.userRepository.save(user);
    const savedTeacher = await this.teacherRepository.save(newTeacher);

    if (savedTeacher) {
      const info = await transporter.sendMail({
        from: '"¡Inicia sesión!" <eralejo2003@gmail.com>', // sender address
        to: user.email as string, // list of receivers
        subject: '¡Bienvenido a registro UNAH!', // Subject line
        text: `Nombre: ${user.firstName} ${user.secondName} ${user.firstLastName} ${user.secondLastName}
            \Número de cuenta: ${user.dni}\nContraseña ${newPassword}\nCorreo institucional: ${newTeacher.institutionalEmail}`, // plain text body
      });
    }

    return {
      teacher: newTeacher,
    };
  }

  findAll() {
    const allTeachers = this.teacherRepository.find({ relations: ['user'] });
    return allTeachers;
  }

  findOne(id: number) {
    return `This action returns a #${id} teacher`;
  }

  update(id: number, updateTeacherDto: UpdateTeacherDto) {
    return `This action updates a #${id} teacher`;
  }

  remove(id: number) {
    return `This action removes a #${id} teacher`;
  }
}
