import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Word } from './word.entity';

export enum PartOfSpeech {
  NOUN = 'noun',
  VERB = 'verb',
  ADJECTIVE = 'adjective',
  ADVERB = 'adverb',
  PREPOSITION = 'preposition',
  CONJUNCTION = 'conjunction',
  PRONOUN = 'pronoun',
  INTERJECTION = 'interjection',
  PHRASE = 'phrase',
  OTHER = 'other',
}

@Entity('definitions')
@Index('idx_def_word_id', ['wordId'])
@Index('idx_def_sort', ['wordId', 'sortOrder'])
export class Definition {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'word_id', type: 'int', unsigned: true })
  wordId: number;

  @Column({ name: 'part_of_speech', type: 'enum', enum: PartOfSpeech })
  partOfSpeech: PartOfSpeech;

  @Column({ type: 'text' })
  definition: string;

  @Column({ type: 'text', nullable: true })
  example: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'sort_order', type: 'tinyint', unsigned: true, default: 0 })
  sortOrder: number; // controls display order

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  // ─── Relations ──────────────────────────────────────────
  @ManyToOne(() => Word, (word) => word.definitions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'word_id' })
  word: Word;
}
