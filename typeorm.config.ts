import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { DatabaseConfigBuilder } from './src/config/database.base';

// Load environment variables
config();

const dataSource = new DataSource(DatabaseConfigBuilder.buildCliConfig());

export default dataSource;