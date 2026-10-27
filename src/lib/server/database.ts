import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { migrations } from './migrations';

export type Database = DatabaseSync;

export function openDatabase(filename: string): Database {
	if (filename !== ':memory:') {
		mkdirSync(dirname(filename), { recursive: true });
	}

	const db = new DatabaseSync(filename);
	db.exec('PRAGMA journal_mode = WAL');
	db.exec('PRAGMA foreign_keys = ON');
	migrate(db);
	return db;
}

function migrate(db: Database) {
	const { user_version: currentVersion } = db.prepare('PRAGMA user_version').get() as {
		user_version: number;
	};

	migrations.slice(currentVersion).forEach((sql, index) => {
		transaction(db, () => {
			db.exec(sql);
			db.exec(`PRAGMA user_version = ${currentVersion + index + 1}`);
		});
	});
}

export function transaction<T>(db: Database, work: () => T): T {
	db.exec('BEGIN IMMEDIATE');
	try {
		const result = work();
		db.exec('COMMIT');
		return result;
	} catch (error) {
		db.exec('ROLLBACK');
		throw error;
	}
}
