import { PGlite } from "@electric-sql/pglite";
import type { TableInfo, ColumnInfo } from "@/types";

let instance: PGlite | null = null;

export async function initDB(): Promise<PGlite> {
  if (instance) return instance;

  instance = new PGlite("idb://pgide-data", { relaxedDurability: true });

  await instance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      stock INTEGER DEFAULT 0,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      total NUMERIC(10,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );

    INSERT INTO users (name, email) VALUES
      ('Alice Johnson', 'alice@example.com'),
      ('Bob Smith', 'bob@example.com')
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO products (name, price, stock, category) VALUES
      ('Laptop', 999.99, 50, 'Electronics'),
      ('Headphones', 79.99, 200, 'Electronics'),
      ('Coffee Mug', 12.99, 500, 'Kitchen')
    ON CONFLICT DO NOTHING;
  `);

  // Seed orders only if empty
  const orderCount = await instance.query<{ count: string }>(
    "SELECT COUNT(*) as count FROM orders",
  );
  if (orderCount.rows[0].count === "0") {
    await instance.exec(`
      INSERT INTO orders (user_id, total, status) VALUES
        (1, 999.99, 'completed'),
        (2, 92.98, 'pending'),
        (1, 12.99, 'shipped');
    `);
  }

  return instance;
}

export async function getSchema(db: PGlite): Promise<TableInfo[]> {
  const result = await db.query<{
    table_name: string;
    table_schema: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>(`
    SELECT
      t.table_name,
      t.table_schema,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default
    FROM information_schema.tables t
    JOIN information_schema.columns c
      ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position
  `);

  const tableMap = new Map<string, TableInfo>();

  for (const row of result.rows) {
    if (!tableMap.has(row.table_name)) {
      tableMap.set(row.table_name, {
        name: row.table_name,
        schema: row.table_schema,
        columns: [],
      });
    }

    const col: ColumnInfo = {
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === "YES",
      defaultValue: row.column_default,
    };

    tableMap.get(row.table_name)!.columns.push(col);
  }

  return Array.from(tableMap.values());
}

export async function executeQuery(db: PGlite, sql: string) {
  const start = performance.now();
  const result = await db.query(sql);
  const executionTime = Math.round((performance.now() - start) * 100) / 100;

  return {
    rows: (result.rows ?? []) as Record<string, unknown>[],
    columns: result.fields?.map((f) => f.name) ?? [],
    rowCount: result.rows?.length ?? 0,
    executionTime,
  };
}
