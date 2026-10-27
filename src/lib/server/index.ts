import { resolve } from 'node:path';
import { openDatabase } from './database';
import { AdrRepository } from './adrs';
import { ProjectRepository } from './projects';

const configuredPath = process.env.ADR_DB_PATH ?? 'data/adr.db';

export const databasePath =
	configuredPath === ':memory:' ? configuredPath : resolve(configuredPath);

const db = openDatabase(databasePath);

export const projects = new ProjectRepository(db);
export const adrs = new AdrRepository(db);
