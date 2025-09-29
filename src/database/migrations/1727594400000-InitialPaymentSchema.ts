import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialPaymentSchema1727594400000 implements MigrationInterface {
  name = 'InitialPaymentSchema1727594400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'PAID', 'FAIL')`);
    await queryRunner.query(`CREATE TYPE "public"."payments_paymentmethod_enum" AS ENUM('PIX', 'CREDIT_CARD')`);

    // Create payments table
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'cpf',
            type: 'varchar',
            length: '11',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'paymentMethod',
            type: 'enum',
            enum: ['PIX', 'CREDIT_CARD'],
            enumName: 'payments_paymentmethod_enum',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'PAID', 'FAIL'],
            enumName: 'payments_status_enum',
            default: "'PENDING'",
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create optimized performance indexes
    await queryRunner.createIndex('payments', new TableIndex({
      name: 'IDX_payments_cpf_paymentmethod',
      columnNames: ['cpf', 'paymentMethod']
    }));

    await queryRunner.createIndex('payments', new TableIndex({
      name: 'IDX_payments_status_createdat',
      columnNames: ['status', 'createdAt']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table (indexes are dropped automatically)
    await queryRunner.dropTable('payments');

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum"`);
  }
}