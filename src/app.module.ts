import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { StudentModule } from './student/student.module';
import { TeacherModule } from './teacher/teacher.module';
import { RoleModule } from './role/role.module';
import { AuthModule } from './auth/auth.module';
import { CareerModule } from './career/career.module';
import { SharedModuleModule } from './shared-module/shared-module.module';
import { SharedModule1Service } from './shared-module1/shared-module1.service';
import { SharedModuleModule } from './shared-module/shared-module.module';
import { SharedModuleModule } from './shared-module/shared-module.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,
      // -----------------------
      extra: {
        precision: {
          integer: 32,
          decimal: 10,
        },
      },
    }),
    UserModule,
    StudentModule,
    TeacherModule,
    RoleModule,
    AuthModule,
    CareerModule,
    SharedModuleModule,
  ],

  controllers: [AppController],

  providers: [AppService, SharedModule1Service],
})
export class AppModule {}
