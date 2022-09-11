import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';

@Module({
  imports: [HttpModule],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule {}
