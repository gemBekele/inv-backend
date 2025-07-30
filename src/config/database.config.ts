import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'nestjs_user',
  password: process.env.DB_PASSWORD || 'nestjs_password',
  database: process.env.DB_NAME || 'nestjs_db',
  entities: [
    __dirname + '/../database/entities/*.entity{.ts,.js}',
    __dirname + '/../modules/**/entities/*.entity{.ts,.js}',
  ],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
 // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
 ssl: false
};

export default registerAs('database', () => dataSourceOptions);

export const AppDataSource = new DataSource(dataSourceOptions);
