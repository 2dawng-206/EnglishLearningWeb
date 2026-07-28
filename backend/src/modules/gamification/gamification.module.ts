import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { GamificationService } from "./gamification.service";
import { GamificationController } from "./gamification.controller";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
