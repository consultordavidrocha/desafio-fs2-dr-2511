import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca a rota como pública: o JwtAuthGuard global deixa passar sem token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
