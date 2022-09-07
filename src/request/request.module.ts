import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RequestController } from './request.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { RequestService } from './request.service';

@Module({
  imports: [HttpModule, ScheduleModule.forRoot()],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule {}
