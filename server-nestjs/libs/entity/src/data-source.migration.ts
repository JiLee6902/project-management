import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

config({ path: '.env' });
config({ path: '.env.production' });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'project_management',
  synchronize: false,
  logging: true,
  entities: [],
  migrations: [join(__dirname, '/migrations/*.{ts,js}')],
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});
