import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Word } from './entities/word.entity';
import { Definition } from './entities/definition.entity';
import { Tag } from './entities/tag.entity';
import { WordTag } from './entities/word-tag.entity';
import { WordSynonym } from './entities/word-synonym.entity';
import { WordAntonym } from './entities/word-antonym.entity';
import { WordsService } from './words.service';
import { WordsController } from './words.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Word, Definition, Tag, WordTag, WordSynonym, WordAntonym])],
  controllers: [WordsController],
  providers: [WordsService],
  exports: [WordsService],
})
export class WordsModule {}
