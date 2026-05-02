
import fs from 'fs/promises';
import path from 'path';
import { Pool } from 'pg';
import type { Lecturer } from '../types';




type LocalLecturer = Lecturer & {
  id: number;
  created_at: string;
  updated_at: string;
};

type LocalDatabase = {
  lecturers: LocalLecturer[];
  nextLecturer_id: number;
  appraisals: Array<Record<string, unknown>>;
  nextAppraisalId: number;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined,
});

const localDatabasePath = path.join(process.cwd(), 'storage', 'local-db.json');
let pgConnectionAvailable = true;

function createSeedDatabase(): LocalDatabase {
  const now = new Date().toISOString();
  return {
    lecturers: [
      {
        id: 1,
        name: 'Dr. John Smith',
        email: 'john.smith@university.edu',
        department: 'Computer Science',
        rank: 'Associate Professor',
        hire_date: '2015-09-01',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@university.edu',
        department: 'Computer Science',
        rank: 'Lecturer',
        hire_date: '2018-08-15',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        name: 'Prof. Michael Brown',
        email: 'michael.brown@university.edu',
        department: 'Computer Science',
        rank: 'Professor',
        hire_date: '2010-01-10',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 4,
        name: 'Dr. Emily Davis',
        email: 'emily.davis@university.edu',
        department: 'Information Systems',
        rank: 'Lecturer',
        hire_date: '2019-07-01',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 5,
        name: 'Dr. Robert Wilson',
        email: 'robert.wilson@university.edu',
        department: 'Information Systems',
        rank: 'Senior Lecturer',
        hire_date: '2016-06-15',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ],
    nextLecturer_id: 6,
    appraisals: [],

    nextAppraisalId: 1,
  };
}

async function readLocalDatabase(): Promise<LocalDatabase> {
  try {
    const rawContent = await fs.readFile(localDatabasePath, 'utf8');
    return JSON.parse(rawContent) as LocalDatabase;

  } catch {
    const seedDatabase = createSeedDatabase();
    await writeLocalDatabase(seedDatabase);
    return seedDatabase;
  }
}

async function writeLocalDatabase(database: LocalDatabase) {
  await fs.mkdir(path.dirname(localDatabasePath), { recursive: true });
  await fs.writeFile(localDatabasePath, JSON.stringify(database, null, 2), 'utf8');
}

function matchesLecturerQuery(sql: string) {
  return /\blecturers\b/i.test(sql);
}

function isConnectionProblem(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code || '') : '';
  return ['ECONNREFUSED', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR'].includes(code);
}

async function queryLocalDatabase(sql: string, values?: any[]) {
  const database = await readLocalDatabase();
  const normalizedSql = sql.trim().toLowerCase();

  if (normalizedSql.startsWith('select') && normalizedSql.includes('from lecturers')) {
    let lecturers = [...database.lecturers];

    if (normalizedSql.includes('where id = ?')) {
      const lecturer_id = Number(values?.[0]);
      lecturers = lecturers.filter((lecturer) => lecturer.id === lecturer_id);
    } else {
      if (normalizedSql.includes('where department = ?')) {
        const department = values?.[0];
        lecturers = lecturers.filter((lecturer) => lecturer.department === department);
      }

      if (normalizedSql.includes('is_active = ?')) {
        const activeValue = values?.[normalizedSql.includes('where department = ?') ? 1 : 0];
        const isActive = activeValue === true || activeValue === 'true' || activeValue === 1 || activeValue === '1';
        lecturers = lecturers.filter((lecturer) => lecturer.is_active === isActive);
      }

      lecturers = lecturers.sort((left, right) => {
        const leftCreatedAt = new Date(left.created_at).getTime();
        const rightCreatedAt = new Date(right.created_at).getTime();
        return rightCreatedAt - leftCreatedAt;
      });
    }

    return lecturers;
  }

  if (normalizedSql.startsWith('insert into lecturers')) {
    const [name, email, department, rank, hireDate, isActive] = values || [];
    const now = new Date().toISOString();
    const lecturer: LocalLecturer = {
      id: database.nextLecturer_id,
      name,
      email,
      department,
      rank,
      hire_date: hireDate || undefined,
      is_active: isActive !== false,
      created_at: now,
      updated_at: now,
    };

    database.lecturers.push(lecturer);
    database.nextLecturer_id += 1;
    await writeLocalDatabase(database);

    return { insertId: lecturer.id };
  }

  if (normalizedSql.startsWith('update lecturers')) {
    const lecturer_id = Number(values?.[values.length - 1]);
    const index = database.lecturers.findIndex((lecturer) => lecturer.id === lecturer_id);

    if (index >= 0) {
      const updateValues = values?.slice(0, -1) || [];
      const setClause = normalizedSql.split('set')[1]?.split('where')[0] || '';
      const fields = setClause.split(',').map((fragment) => fragment.split('=')[0].trim());

      fields.forEach((field, position) => {
        const value = updateValues[position];
        if (field in database.lecturers[index]) {
          (database.lecturers[index] as unknown as Record<string, unknown>)[field] = value;
        }
      });

      database.lecturers[index].updated_at = new Date().toISOString();
      await writeLocalDatabase(database);
    }

    return { affectedRows: index >= 0 ? 1 : 0 };
  }

  if (normalizedSql.startsWith('delete from lecturers')) {
    const lecturer_id = Number(values?.[0]);
    const beforeCount = database.lecturers.length;
    database.lecturers = database.lecturers.filter((lecturer) => lecturer.id !== lecturer_id);
    await writeLocalDatabase(database);

    return { affectedRows: beforeCount - database.lecturers.length };
  }

  throw new Error(`Local database fallback does not support query: ${sql}`);
}

/**
 * Execute a database query
 */
export async function query(sql: string, values?: any[]) {
  try {
    if (pgConnectionAvailable) {
      try {
        const client = await pool.connect();
        const res = await client.query(sql, values);
        client.release();
        // For SELECT, return rows; for INSERT/UPDATE/DELETE, return result object
        if (res.command === 'SELECT') return res.rows;
        if (res.command === 'INSERT') return { insertId: res.rows[0]?.id };
        return res;
      } catch (error) {
        if (!matchesLecturerQuery(sql) || !isConnectionProblem(error)) {
          throw error;
        }
        pgConnectionAvailable = false;
        console.warn('PostgreSQL unavailable. Falling back to local lecturer store.');
      }
    }
    if (matchesLecturerQuery(sql)) {
      return queryLocalDatabase(sql, values);
    }
    throw new Error('PostgreSQL is unavailable and no fallback exists for this query');
  } catch (error) {
    console.error('Database query error:', error);

    throw error;
  }
}

/**
 * Get a single row from database
 */

export async function getRow(sql: string, values?: any[]) {
  const results = await query(sql, values);
  return Array.isArray(results) && results.length > 0 ? results[0] : null;
}

/**
 * Get all rows from query
 */

export async function getRows(sql: string, values?: any[]) {
  const results = await query(sql, values);
  return Array.isArray(results) ? results : [];
}

/**
 * Insert data into database
 */

export async function insert(table: string, data: Record<string, any>) {
  const keys = Object.keys(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id`;
  const result = await query(sql, Object.values(data)) as any;
  return result.insertId;
}

/**
 * Update data in database
 */

export async function update(
  table: string,
  data: Record<string, any>,
  whereClause: string,
  whereValues?: any[]
) {
  const sets = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = [...Object.values(data), ...(whereValues || [])];
  const sql = `UPDATE ${table} SET ${sets} WHERE ${whereClause}`;
  return query(sql, values);
}

/**
 * Delete data from database
 */

export async function deleteRecord(
  table: string,
  whereClause: string,
  whereValues?: any[]
) {
  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  return query(sql, whereValues);
}


