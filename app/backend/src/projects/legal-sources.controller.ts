import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { LegalSourcesService } from './legal-sources.service';
import { CreateLegalSourceDto } from './dto/create-legal-source.dto';
import { UpdateLegalSourceDto } from './dto/update-legal-source.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('legal-sources')
export class LegalSourcesController {
  constructor(private readonly legalSourcesService: LegalSourcesService) {}

  @Post()
  create(@Body() createLegalSourceDto: CreateLegalSourceDto, @CurrentUser() user: any) {
    return this.legalSourcesService.create(createLegalSourceDto, user.orgId);
  }

  @Get()
  findAll() {
    return this.legalSourcesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.legalSourcesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateLegalSourceDto: UpdateLegalSourceDto) {
    return this.legalSourcesService.update(id, updateLegalSourceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.legalSourcesService.remove(id);
  }
}
