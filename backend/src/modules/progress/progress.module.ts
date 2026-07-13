import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgress } from './entities/user-progress.entity';
import { ReviewHistory } from './entities/review-history.entity';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { Sm2Service } from './sm2/sm2.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserProgress, ReviewHistory])],
  controllers: [ProgressController],
  providers: [ProgressService, Sm2Service],
  exports: [ProgressService, Sm2Service],
})
export class ProgressModule {}
