import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Word } from './word.entity';
import { Tag } from './tag.entity';

/**
 * Explicit junction entity (instead of an implicit @ManyToMany + @JoinTable)
 * because `word_tags` already exists with its own extra index
 * (idx_wt_tag_id on tag_id alone, for "find all words with tag X" lookups).
 * TypeORM's implicit ManyToMany join-table generator doesn't give per-column
 * index control, so we model the table directly and expose `word`/`tag` as
 * OneToMany relations on the parent entities instead of a direct ManyToMany.
 */
@Entity('word_tags')
@Index('idx_wt_tag_id', ['tagId'])
export class WordTag {
  @PrimaryColumn({ name: 'word_id', type: 'int', unsigned: true })
  wordId: number;

  @PrimaryColumn({ name: 'tag_id', type: 'int', unsigned: true })
  tagId: number;

  @ManyToOne(() => Word, (word) => word.wordTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'word_id' })
  word: Word;

  @ManyToOne(() => Tag, (tag) => tag.wordTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
