import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LawsuitDetailDto, LawsuitQuery } from './dto/lawsuit.dto';
import { LawsuitsService } from './lawsuits.service';

@ApiTags('Processos')
@ApiBearerAuth()
@Controller('processos')
export class LawsuitsController {
  constructor(private readonly lawsuits: LawsuitsService) {}

  @Get(':numero')
  @ApiOperation({
    summary: 'Detalhe do processo e suas comunicações (bônus)',
  })
  @ApiParam({
    name: 'numero',
    description: 'Número CNJ, com ou sem máscara',
    example: '1234567-89.2024.8.26.0100',
  })
  @ApiOkResponse({ type: LawsuitDetailDto })
  @ApiBadRequestResponse({ description: 'Número ou paginação inválidos' })
  @ApiNotFoundResponse({ description: 'Processo não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
  findOne(
    @Param('numero') numero: string,
    @Query() query: LawsuitQuery,
  ): Promise<LawsuitDetailDto> {
    return this.lawsuits.findByNumber(numero, query);
  }
}
