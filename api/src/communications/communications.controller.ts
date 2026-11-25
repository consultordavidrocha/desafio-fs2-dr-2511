import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
import {
  CommunicationPageDto,
  CommunicationSummaryDto,
} from './dto/communication.dto';
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

  /**
   * Bônus: resumo extrativo (sem LLM), ver summary/summarizer.ts.
   * POST porque o contrato do case define assim (e o resumo poderia, numa
   * versão com LLM, ter custo/efeito: não é uma leitura "barata" como um GET).
   */
  @Post(':id/resumo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resumo do conteúdo da comunicação (bônus)' })
  @ApiOkResponse({ type: CommunicationSummaryDto })
  @ApiBadRequestResponse({ description: 'id inválido' })
  @ApiNotFoundResponse({ description: 'Comunicação não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
  summarize(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CommunicationSummaryDto> {
    return this.communications.summarize(id);
  }
}
