import { Module } from '@nestjs/common';
import { GenerateTokenService } from './generate-token/generate-token.service';
import { SendEmailService } from './send-email/send-email.service';
import { EncryptPasswordService } from './encrypt-password/encrypt-password.service';
import { GenerateEmployeeNumberService } from './generte-employee-number/generate-employee-number.service';
import { AccountNumberService } from './account-number/account-number.service';
import { GenerateEmailService } from './generate-email/generate-email.service';

@Module({
  controllers: [],
  providers: [GenerateTokenService, SendEmailService, EncryptPasswordService, GenerateEmployeeNumberService, AccountNumberService, GenerateEmailService],
  exports: [GenerateTokenService, SendEmailService, EncryptPasswordService, GenerateEmployeeNumberService, AccountNumberService, GenerateEmailService]
})
export class SharedModule {}
