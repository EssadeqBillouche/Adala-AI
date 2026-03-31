import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeormConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('Db_URL'),
  autoLoadEntities: true,
  synchronize: true,
  ssl: {
    rejectUnauthorized:
      configService.get<string>('NODE_ENV') === 'production',
  },
});
