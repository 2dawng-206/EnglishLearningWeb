import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Word } from './word.entity';

@Entity('word_antonyms')
@Unique('uq_word_antonym', ['wordId', 'antonym'])
@Index('idx_ant_word', ['wordId'])
export class WordAntonym {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'word_id', type: 'int', unsigned: true })
  wordId: number;

  @Column({ type: 'varchar', length: 100 })
  antonym: string;

  // ─── Relations ──────────────────────────────────────────
  @ManyToOne(() => Word, (word) => word.antonyms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'word_id' })
  word: Word;
}
