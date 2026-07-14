import { Global, Module } from '@nestjs/common';
import { R2ClientService } from '@/src/common/r2/service/r2-client.service';

@Global()
@Module({
  providers: [R2ClientService],
  exports: [R2ClientService],
})
export class R2Module {}