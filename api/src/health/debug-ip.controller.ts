import { Controller, Get, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';

/**
 * TEMPORÁRIO (auditoria 26/11): mostra como o IP do cliente chega atrás do
 * Render + Cloudflare, para configurar o rate limit. Devolve só os dados de
 * quem chama. Removido no commit seguinte.
 */
@ApiExcludeController()
@Controller('debug-ip')
export class DebugIpController {
  @Public()
  @Get()
  show(@Req() req: Request) {
    const h = req.headers;
    return {
      ip: req.ip,
      ips: req.ips,
      remote: req.socket.remoteAddress,
      xff: h['x-forwarded-for'] ?? null,
      cfConnectingIp: h['cf-connecting-ip'] ?? null,
      trueClientIp: h['true-client-ip'] ?? null,
      xRealIp: h['x-real-ip'] ?? null,
    };
  }
}
