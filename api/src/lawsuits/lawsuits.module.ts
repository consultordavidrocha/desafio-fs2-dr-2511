import { Module } from '@nestjs/common';
import { LawsuitsController } from './lawsuits.controller';
import { LawsuitsService } from './lawsuits.service';

@Module({
  controllers: [LawsuitsController],
  providers: [LawsuitsService],
})
export class LawsuitsModule {}
