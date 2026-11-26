import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UserDto } from './dto/user.dto';
import type { JwtPayload } from './jwt-payload';

/** Rotas em português: são fixadas pelo contrato do case. */
@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('cadastro')
  @ApiOperation({ summary: 'Cria uma conta' })
  @ApiCreatedResponse({ type: UserDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado' })
  @ApiTooManyRequestsResponse({ description: 'Muitas tentativas por minuto' })
  signUp(@Body() dto: SignUpDto): Promise<UserDto> {
    return this.auth.signUp(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica e devolve o access token (JWT)' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiUnauthorizedResponse({ description: 'E-mail ou senha incorretos' })
  @ApiTooManyRequestsResponse({ description: 'Muitas tentativas por minuto' })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.auth.login(dto);
  }

  /** Extra (fora do contrato): dados do usuário logado, usados no avatar do front. */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuário autenticado' })
  @ApiOkResponse({ type: UserDto })
  @ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
  me(@CurrentUser() user: JwtPayload): UserDto {
    return { id: user.sub, name: user.name, email: user.email };
  }
}
