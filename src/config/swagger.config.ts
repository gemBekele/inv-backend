import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  title: process.env.SWAGGER_TITLE || 'NestJS Backend Starter API',
  description: process.env.SWAGGER_DESCRIPTION || 'A comprehensive NestJS backend starter template API',
  version: process.env.SWAGGER_VERSION || '1.0',
  tag: process.env.SWAGGER_TAG || 'api',
}));