import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalSourcesService } from './legal-sources.service';
import { LegalSourcesController } from './legal-sources.controller';
import { LegalSource } from './entities/legal-source.entity';
import { TenancyModule } from '../tenancy/tenancy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegalSource]),
    TenancyModule,
  ],
  controllers: [LegalSourcesController],
  providers: [LegalSourcesService],
  exports: [LegalSourcesService],
})
export class LegalSourcesModule {}
