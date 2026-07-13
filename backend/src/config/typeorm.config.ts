import { readFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Builds TypeORM connection options for Aiven MySQL (cloud managed, SSL-only).
 *
 * IMPORTANT: synchronize is hard-coded to false. The schema was hand-authored
 * and already deployed via raw SQL — letting TypeORM "helpfully" auto-sync
 * entity definitions against it is exactly the kind of self-inflicted schema
 * drift the project rules explicitly forbid. Use migrations if/when the
 * schema needs to evolve later.
 */
export function getTypeOrmConfig(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: config.get<string>('DB_HOST'),
    port: config.get<number>('DB_PORT'),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_DATABASE'),
    ssl: {
      ca: readFileSync(config.getOrThrow<string>('DB_SSL_CA_PATH')).toString(),
      rejectUnauthorized: true,
    },
    entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
    synchronize: false,
    logging: config.get<string>('NODE_ENV') !== 'production',
  };
}
