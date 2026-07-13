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

@Entity('word_synonyms')
@Unique('uq_word_synonym', ['wordId', 'synonym'])
@Index('idx_syn_word', ['wordId'])
export class WordSynonym {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'word_id', type: 'int', unsigned: true })
  wordId: number;

  @Column({ type: 'varchar', length: 100 })
  synonym: string;

  // ─── Relations ──────────────────────────────────────────
  @ManyToOne(() => Word, (word) => word.synonyms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'word_id' })
  word: Word;
}
