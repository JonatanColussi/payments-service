import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { DatabaseConfigBuilder } from '../config/database.base';

// Load environment variables
config();

const AppDataSource = new DataSource(DatabaseConfigBuilder.buildCliConfig());

export default AppDataSource;