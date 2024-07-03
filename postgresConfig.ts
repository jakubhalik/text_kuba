import { Pool } from 'pg';

export const owner = process.env.owner; // as string;
export const postgres_password = process.env.postgres_password; // as string;
export const host = process.env.host; // as string;
export const port = process.env.port ? Number(process.env.port) : 5432;

if (!owner || !postgres_password || !host || !port) {
    throw new Error(
        'Missing required environment variables for PostgreSQL configuration'
    );
}

export const postgresUserPool = new Pool({
    host,
    port,
    database: `text_${owner}`,
    user: 'postgres',
    password: postgres_password,
});
