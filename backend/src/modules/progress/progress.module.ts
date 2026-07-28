import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserProgress } from "./entities/user-progress.entity";
import { ReviewHistory } from "./entities/review-history.entity";
import { Sm2Service } from "./sm2/sm2.service";
import { ProgressService } from "./progress.service";
import { ProgressController } from "./progress.controller";
import { GamificationModule } from "../gamification/gamification.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProgress, ReviewHistory]),
    GamificationModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService, Sm2Service],
  exports: [ProgressService],
})
export class ProgressModule {}
