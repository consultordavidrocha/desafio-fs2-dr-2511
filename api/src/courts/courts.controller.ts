import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CourtsService } from './courts.service';
import { CourtDto } from './dto/court.dto';

@ApiTags('Tribunais')
@ApiBearerAuth()
@Controller('tribunais')
export class CourtsController {
  constructor(private readonly courts: CourtsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os tribunais (para o filtro)' })
  @ApiOkResponse({ type: CourtDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
  findAll(): Promise<CourtDto[]> {
    return this.courts.findAll();
  }
}
