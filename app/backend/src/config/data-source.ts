import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config(); // Load the .env file

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.Db_URL,
  synchronize: false,
  ssl: { rejectUnauthorized: false },
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
});
