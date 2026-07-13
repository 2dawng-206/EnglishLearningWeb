import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError, Repository } from 'typeorm';
import { Word } from './entities/word.entity';
import { Definition } from './entities/definition.entity';
import { Tag } from './entities/tag.entity';
import { WordTag } from './entities/word-tag.entity';
import { WordSynonym } from './entities/word-synonym.entity';
import { WordAntonym } from './entities/word-antonym.entity';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { QueryWordDto } from './dto/query-word.dto';

export interface PaginatedWords {
  items: Word[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// MySQL errno 1451 = ER_ROW_IS_REFERENCED_2 (child row exists elsewhere).
// Hits here specifically because user_progress.word_id is ON DELETE RESTRICT.
const MYSQL_ROW_IS_REFERENCED = 1451;

@Injectable()
export class WordsService {
  constructor(
    @InjectRepository(Word) private readonly wordsRepository: Repository<Word>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async findAll(query: QueryWordDto): Promise<PaginatedWords> {
    const { search, difficulty, cefrLevel, tag, page = 1, limit = 20 } = query;

    const qb = this.wordsRepository
      .createQueryBuilder('word')
      .leftJoinAndSelect('word.definitions', 'definition')
      .where('word.isPublished = :isPublished', { isPublished: true });

    if (search) {
      qb.andWhere('MATCH(word.word) AGAINST (:search IN NATURAL LANGUAGE MODE)', { search });
    }
    if (difficulty) {
      qb.andWhere('word.difficulty = :difficulty', { difficulty });
    }
    if (cefrLevel) {
      qb.andWhere('word.cefrLevel = :cefrLevel', { cefrLevel });
    }
    if (tag) {
      qb.innerJoin('word.wordTags', 'wordTag')
        .innerJoin('wordTag.tag', 'tagEntity')
        .andWhere('tagEntity.name = :tag', { tag });
    }

    // NOTE: plain ASC sort — MySQL puts NULLs *first* on ASC (unlike Postgres,
    // which defaults to NULLs last), so words without a frequencyRank will
    // sort ahead of ranked ones. A `CASE WHEN frequency_rank IS NULL THEN 1
    // ELSE 0 END` expression would flip that, but that's untested raw SQL
    // I'm not shipping without a real DB to run it against — flagging as a
    // follow-up rather than guessing.
    const [items, total] = await qb
      .orderBy('word.frequencyRank', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<Word> {
    const word = await this.wordsRepository.findOne({
      where: { id },
      relations: {
        definitions: true,
        synonyms: true,
        antonyms: true,
        wordTags: { tag: true },
      },
    });
    if (!word) throw new NotFoundException(`Word #${id} not found`);
    // Definitions have their own sort_order — apply it here since the
    // `relations` shorthand above doesn't accept a per-relation `order`.
    word.definitions?.sort((a, b) => a.sortOrder - b.sortOrder);
    return word;
  }

  async create(dto: CreateWordDto): Promise<Word> {
    // Only the new word's id crosses the transaction boundary — the final
    // read happens afterward via the plain repository. Calling this.findOne
    // *inside* the transaction would read through a different connection
    // than the one holding the uncommitted writes.
    const wordId = await this.dataSource.transaction(async (manager) => {
      const word = manager.create(Word, {
        word: dto.word,
        phoneticUk: dto.phoneticUk,
        phoneticUs: dto.phoneticUs,
        audioUrlUk: dto.audioUrlUk,
        audioUrlUs: dto.audioUrlUs,
        etymology: dto.etymology,
        mnemonic: dto.mnemonic,
        difficulty: dto.difficulty,
        cefrLevel: dto.cefrLevel,
        frequencyRank: dto.frequencyRank,
        isPublished: dto.isPublished,
      });
      const savedWord = await manager.save(word);

      await manager.save(
        dto.definitions.map((d) => manager.create(Definition, { ...d, wordId: savedWord.id })),
      );

      if (dto.synonyms?.length) {
        await manager.save(
          dto.synonyms.map((s) => manager.create(WordSynonym, { wordId: savedWord.id, synonym: s })),
        );
      }
      if (dto.antonyms?.length) {
        await manager.save(
          dto.antonyms.map((a) => manager.create(WordAntonym, { wordId: savedWord.id, antonym: a })),
        );
      }
      if (dto.tags?.length) {
        await this.linkTags(manager, savedWord.id, dto.tags);
      }

      return savedWord.id;
    });

    return this.findOne(wordId);
  }

  async update(id: number, dto: UpdateWordDto): Promise<Word> {
    const existing = await this.wordsRepository.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Word #${id} not found`);

    const { definitions, synonyms, antonyms, tags, ...wordFields } = dto;

    await this.dataSource.transaction(async (manager) => {
      if (Object.keys(wordFields).length > 0) {
        await manager.update(Word, id, wordFields);
      }

      // Replace-whole-collection semantics: if the array is present in the
      // PATCH body at all, it fully replaces the existing rows for this
      // word rather than merging item-by-item.
      if (definitions) {
        await manager.delete(Definition, { wordId: id });
        await manager.save(definitions.map((d) => manager.create(Definition, { ...d, wordId: id })));
      }
      if (synonyms) {
        await manager.delete(WordSynonym, { wordId: id });
        await manager.save(synonyms.map((s) => manager.create(WordSynonym, { wordId: id, synonym: s })));
      }
      if (antonyms) {
        await manager.delete(WordAntonym, { wordId: id });
        await manager.save(antonyms.map((a) => manager.create(WordAntonym, { wordId: id, antonym: a })));
      }
      if (tags) {
        await manager.delete(WordTag, { wordId: id });
        await this.linkTags(manager, id, tags);
      }
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.wordsRepository.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Word #${id} not found`);

    try {
      await this.wordsRepository.delete(id);
    } catch (error) {
      const errno = (error as QueryFailedError & { driverError?: { errno?: number } }).driverError?.errno;
      if (error instanceof QueryFailedError && errno === MYSQL_ROW_IS_REFERENCED) {
        throw new ConflictException(
          'This word has learner progress tied to it and cannot be deleted. Set isPublished to false to hide it instead.',
        );
      }
      throw error;
    }
  }

  /** Find-or-create each tag by name, then link it to the word via word_tags. */
  private async linkTags(manager: EntityManager, wordId: number, tagNames: string[]): Promise<void> {
    for (const name of tagNames) {
      let tag = await manager.findOne(Tag, { where: { name } });
      if (!tag) {
        tag = await manager.save(manager.create(Tag, { name }));
      }
      await manager.save(manager.create(WordTag, { wordId, tagId: tag.id }));
    }
  }
}
