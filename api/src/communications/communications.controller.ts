import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
import { CommunicationPageDto } from './dto/communication.dto';
import { ListCommunicationsQuery } from './dto/list-communications.query';

@ApiTags('Comunicações')
@ApiBearerAuth()
@Controller('comunicacoes')
export class CommunicationsController {
  constructor(private readonly communications: CommunicationsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lista paginada de comunicações, da mais recente para a mais antiga',
  })
  @ApiOkResponse({ type: CommunicationPageDto })
  @ApiBadRequestResponse({
    description: 'Filtro inválido (ex.: pageSize acima de 50, data inválida)',
  })
  @ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
  list(@Query() query: ListCommunicationsQuery): Promise<CommunicationPageDto> {
    return this.communications.list(query);
  }
}
