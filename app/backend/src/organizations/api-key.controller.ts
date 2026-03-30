import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  create(@Body() createApiKeyDto: CreateApiKeyDto, @CurrentUser() user: any) {
    return this.apiKeyService.create(createApiKeyDto, user.orgId);
  }

  @Get()
  findAll() {
    return this.apiKeyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apiKeyService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateApiKeyDto: UpdateApiKeyDto) {
    return this.apiKeyService.update(id, updateApiKeyDto);
  }

  @Post(':id/revoke')
  revoke(@Param('id') id: string) {
    return this.apiKeyService.revoke(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apiKeyService.remove(id);
  }
}
