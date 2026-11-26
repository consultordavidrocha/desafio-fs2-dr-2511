import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Saúde')
@Controller('live')
export class LiveController {
  /**
   * "O processo está de pé" — sem tocar no banco (liveness × readiness, como na P3).
   *
   * Usado pelo keep-alive (.github/workflows/keep-alive.yml), que mantém a API
   * acordada no plano gratuito do Render durante o dia. Por não consultar o
   * Postgres, o ping não impede o Neon de desligar quando ocioso e não gasta a
   * cota gratuita de processamento do banco. Para "API + banco", use /health.
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Verifica se a API está no ar (sem consultar o banco)',
  })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
