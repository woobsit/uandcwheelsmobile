// src/test/test-ormconfig.ts
export = {
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "test",
  password: "test",
  database: "test_db",
  synchronize: true,
  logging: false,
  dropSchema: true, // Clean database for each test run
  entities: ["src/entities/**/*.ts"],
  migrations: ["src/migrations/**/*.ts"]
}