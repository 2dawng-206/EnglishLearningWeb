import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Definition } from './definition.entity';
import { WordSynonym } from './word-synonym.entity';
import { WordAntonym } from './word-antonym.entity';
import { WordTag } from './word-tag.entity';
import { UserProgress } from '../../progress/entities/user-progress.entity';

export enum WordDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum CefrLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
}

export enum WordSource {
  MANUAL = 'manual',
  DICTIONARY_API = 'dictionary_api',
  CSV_IMPORT = 'csv_import',
}

@Entity('words')
@Index('idx_difficulty_pub', ['difficulty', 'isPublished'])
@Index('idx_cefr_pub', ['cefrLevel', 'isPublished'])
@Index('idx_frequency', ['frequencyRank'])
// MATCH...AGAINST search (Phase 2). If your TypeORM version's `synchronize`
// doesn't pick up `fulltext` correctly, no functional risk — the index
// already exists physically in the DB from the SQL script you ran.
@Index('ft_word', ['word'], { fulltext: true })
export class Word {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  word: string;

  @Column({ name: 'phonetic_uk', type: 'varchar', length: 100, nullable: true })
  phoneticUk: string | null;

  @Column({ name: 'phonetic_us', type: 'varchar', length: 100, nullable: true })
  phoneticUs: string | null;

  @Column({ name: 'audio_url_uk', type: 'varchar', length: 500, nullable: true })
  audioUrlUk: string | null;

  @Column({ name: 'audio_url_us', type: 'varchar', length: 500, nullable: true })
  audioUrlUs: string | null;

  @Column({ type: 'text', nullable: true })
  etymology: string | null;

  @Column({ type: 'text', nullable: true })
  mnemonic: string | null;

  @Column({
    type: 'enum',
    enum: WordDifficulty,
    default: WordDifficulty.INTERMEDIATE,
  })
  difficulty: WordDifficulty;

  @Column({ name: 'cefr_level', type: 'enum', enum: CefrLevel, nullable: true })
  cefrLevel: CefrLevel | null;

  @Column({ name: 'frequency_rank', type: 'int', unsigned: true, nullable: true })
  frequencyRank: number | null; // 1 = most common English word

  @Column({ type: 'enum', enum: WordSource, default: WordSource.MANUAL })
  source: WordSource;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  // ─── Relations ──────────────────────────────────────────
  @OneToMany(() => Definition, (definition) => definition.word)
  definitions: Definition[];

  @OneToMany(() => WordSynonym, (synonym) => synonym.word)
  synonyms: WordSynonym[];

  @OneToMany(() => WordAntonym, (antonym) => antonym.word)
  antonyms: WordAntonym[];

  @OneToMany(() => WordTag, (wordTag) => wordTag.word)
  wordTags: WordTag[];

  @OneToMany(() => UserProgress, (progress) => progress.word)
  userProgress: UserProgress[];
}
