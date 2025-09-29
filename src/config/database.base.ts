import { DataSourceOptions } from 'typeorm';

/**
 * Base database configuration interface
 */
interface DatabaseConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
  ssl: boolean | { rejectUnauthorized: boolean };
  extra: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };
}

/**
 * Base database configuration builder
 * Provides shared configuration logic for both NestJS and TypeORM CLI
 */
export class DatabaseConfigBuilder {
  /**
   * Parse environment variable as integer with fallback
   */
  private static parseInt(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Parse environment variable as boolean
   */
  private static parseBoolean(value: string | undefined): boolean {
    return value === 'true';
  }

  /**
   * Get SSL configuration based on environment
   */
  private static getSslConfig(): boolean | { rejectUnauthorized: boolean } {
    return this.parseBoolean(process.env.DATABASE_SSL) ? {
      rejectUnauthorized: false,
    } : false;
  }

  /**
   * Get connection pool configuration
   */
  private static getPoolConfig() {
    return {
      max: this.parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10),
      min: this.parseInt(process.env.DATABASE_MIN_CONNECTIONS, 2),
      idleTimeoutMillis: this.parseInt(process.env.DATABASE_IDLE_TIMEOUT, 30000),
      connectionTimeoutMillis: this.parseInt(process.env.DATABASE_CONNECTION_TIMEOUT, 5000),
    };
  }

  /**
   * Build base database configuration
   */
  static buildBaseConfig(): DatabaseConfig {
    return {
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: this.parseInt(process.env.DATABASE_PORT, 5432),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'payments_db',
      synchronize: this.parseBoolean(process.env.DATABASE_SYNCHRONIZE),
      logging: this.parseBoolean(process.env.DATABASE_LOGGING),
      ssl: this.getSslConfig(),
      extra: this.getPoolConfig(),
    };
  }

  /**
   * Build TypeORM CLI configuration
   */
  static buildCliConfig(): DataSourceOptions {
    const baseConfig = this.buildBaseConfig();
    return {
      ...baseConfig,
      entities: ['src/**/*.entity{.ts,.js}'],
      migrations: ['src/database/migrations/*{.ts,.js}'],
      subscribers: ['src/**/*.subscriber{.ts,.js}'],
      synchronize: false, // Always false for CLI operations
    } as DataSourceOptions;
  }

  /**
   * Build NestJS TypeORM configuration
   */
  static buildNestConfig() {
    const baseConfig = this.buildBaseConfig();
    return {
      ...baseConfig,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      subscribers: [__dirname + '/../**/*.subscriber{.ts,.js}'],
      migrationsRun: this.parseBoolean(process.env.DATABASE_MIGRATIONS_RUN),
    };
  }
}