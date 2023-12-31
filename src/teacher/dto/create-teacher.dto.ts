import { PartialType, PickType } from '@nestjs/mapped-types';
import {
  IsString,
  IsOptional,
  IsBooleanString,
  IsUrl,
  IsNotEmpty,
} from 'class-validator';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

export class CreateTeacherDto extends PartialType(PickType(CreateUserDto, ['dni','firstName','secondName','firstLastName', 'secondLastName', 'email', 'address', 'phone', 'description'])) {

  // @IsBooleanString({message:"El campo Es Docente debe ser de tipo boleano"})
  // @IsNotEmpty({message:"No envió o dejo vacio el campo es Docente"})
  // @IsOptional()
  // isTeacher: boolean;
  
  @IsBooleanString({message:"El campo Es Jefe debe ser de tipo boleano"})
  @IsNotEmpty({message:"No envió o dejo vacio el campo es Jefe"})
  @IsOptional()
  isBoss: boolean;
  
  @IsBooleanString({message:"El campo Es Coordinador debe ser de tipo boleano"})
  @IsNotEmpty({message:"No envió o dejo vacio el campo es Coordinador"})
  @IsOptional()
  isCoordinator: boolean;
  
  @IsString({message:"El campo video, no cumple el formato establecido"})
  @IsNotEmpty({message:"No envió o dejo vacio el campo video"})
  @IsOptional()
  video: string;

  @IsOptional()
  @IsString({message: "La Fotografia uno, no cumple el formtao requerido."})
  @IsNotEmpty({message: "No envió o dejo vacio el campo primer fotografia"})
  photoOne: string;


  @IsString({message: "EL campo carrera debe ser de tipo texto"})
  @IsNotEmpty({message: "No envió o dejo vacio el campo carrera"})
  career: string;

  @IsString({message: "EL centro regional debe ser de tipo texto"})
  @IsNotEmpty({message: "No envió o dejo vacio el campo centro regional"})
  regionalCenter: string;
}
