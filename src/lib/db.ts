import { PGlite, Results } from "@electric-sql/pglite";

export type QueryResult = {
  rows: Results["rows"];
  duration: number;
  message: string;
  status: "success" | "error";
};

/**
 * Initialize the database connection
 * @returns Promise that resolves to a PGlite instance when initialization is complete
 */
export async function initDB(): Promise<PGlite> {
  console.log("Creating PGlite database instance...");

  try {
    const db = await PGlite.create("idb://my-pgdata", {
      relaxedDurability: true,
    });

    console.log("Database instance created successfully");

    await db.exec(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert sample data into users
      INSERT INTO users (name, email, created_at)
      SELECT 'John Doe', 'john@example.com', '2023-01-15T08:30:00Z'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'john@example.com');

      INSERT INTO users (name, email, created_at)
      SELECT 'Jane Smith', 'jane@example.com', '2023-02-20T14:15:00Z'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'jane@example.com');

      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT,
        price NUMERIC,
        stock INTEGER,
        category TEXT
      );

      -- Insert sample data into products
      INSERT INTO products (name, price, stock, category)
      SELECT 'Laptop', 1299.99, 45, 'Electronics'
      WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Laptop');

      INSERT INTO products (name, price, stock, category)
      SELECT 'Smartphone', 899.99, 120, 'Electronics'
      WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Smartphone');

      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total NUMERIC,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert sample data into orders
      INSERT INTO orders (user_id, total, status, created_at)
      SELECT 1, 1299.99, 'completed', '2023-06-10T13:45:00Z'
      WHERE NOT EXISTS (SELECT 1 FROM orders WHERE user_id = 1 AND total = 1299.99 AND created_at = '2023-06-10T13:45:00Z');

      INSERT INTO orders (user_id, total, status, created_at)
      SELECT 2, 899.99, 'processing', '2023-06-12T10:30:00Z'
      WHERE NOT EXISTS (SELECT 1 FROM orders WHERE user_id = 2 AND total = 899.99 AND created_at = '2023-06-12T10:30:00Z');
    `);

    console.log("Database schema initialized successfully");
    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

/**
 * Execute a SQL query against the database
 * @param db PGlite instance
 * @param query SQL query to execute
 * @returns Promise resolving to QueryResult
 */
export async function executeQuery(
  db: PGlite,
  query: string
): Promise<QueryResult> {
  try {
    const startTime = performance.now();
    const result = await db.exec(query);
    const lastQuery = result[result.length - 1];
    const duration = performance.now() - startTime;

    return {
      rows: lastQuery.rows || [],
      duration: Math.round(duration),
      message: "Query executed successfully",
      status: "success",
    };
  } catch (error) {
    return {
      rows: [],
      duration: 0,
      message:
        (error as Error).message || "An error occurred during query execution",
      status: "error",
    };
  }
}

/**
 * Get a list of all tables and their columns in the database
 * @param db PGlite instance
 * @returns Promise resolving to a map of table names to column names
 */
export async function getTables(db: PGlite): Promise<Record<string, string[]>> {
  try {
    const result = await executeQuery(
      db,
      `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `
    );

    const tableMap: Record<string, string[]> = {};

    for (const row of result.rows) {
      const tableName = row.table_name;
      const columnName = row.column_name;

      if (!tableMap[tableName]) {
        tableMap[tableName] = [];
      }

      tableMap[tableName].push(columnName);
    }

    return tableMap;
  } catch (error) {
    console.error("Failed to get table and column list:", error);
    return {};
  }
}
