import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { WordTag } from './word-tag.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
  // NOTE: `tags` has no updated_at in the schema — intentionally not mapped.

  // ─── Relations ──────────────────────────────────────────
  @OneToMany(() => WordTag, (wordTag) => wordTag.tag)
  wordTags: WordTag[];
}
