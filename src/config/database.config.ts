import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DatabaseConfigBuilder } from './database.base';

export default registerAs('database', (): TypeOrmModuleOptions => 
  DatabaseConfigBuilder.buildNestConfig() as TypeOrmModuleOptions
);