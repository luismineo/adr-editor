const now = `(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const migrations: string[] = [
	`
	CREATE TABLE projects (
		id INTEGER PRIMARY KEY,
		name TEXT NOT NULL,
		description TEXT NOT NULL DEFAULT '',
		default_template TEXT NOT NULL DEFAULT 'madr',
		archived_at TEXT,
		created_at TEXT NOT NULL DEFAULT ${now},
		updated_at TEXT NOT NULL DEFAULT ${now}
	);

	CREATE TABLE adrs (
		id INTEGER PRIMARY KEY,
		project_id INTEGER NOT NULL REFERENCES projects (id),
		number INTEGER NOT NULL,
		title TEXT NOT NULL,
		status TEXT NOT NULL,
		tags TEXT NOT NULL DEFAULT '[]',
		deciders TEXT NOT NULL DEFAULT '[]',
		superseded_by INTEGER,
		body TEXT NOT NULL DEFAULT '',
		revision INTEGER NOT NULL DEFAULT 1,
		archived_at TEXT,
		created_at TEXT NOT NULL DEFAULT ${now},
		updated_at TEXT NOT NULL DEFAULT ${now},
		UNIQUE (project_id, number)
	);

	CREATE TABLE adr_revisions (
		id INTEGER PRIMARY KEY,
		adr_id INTEGER NOT NULL REFERENCES adrs (id),
		revision INTEGER NOT NULL,
		title TEXT NOT NULL,
		status TEXT NOT NULL,
		tags TEXT NOT NULL,
		deciders TEXT NOT NULL,
		superseded_by INTEGER,
		body TEXT NOT NULL,
		note TEXT NOT NULL DEFAULT '',
		created_at TEXT NOT NULL DEFAULT ${now},
		UNIQUE (adr_id, revision)
	);

	CREATE TRIGGER adr_revisions_are_immutable BEFORE UPDATE ON adr_revisions
	BEGIN
		SELECT RAISE(ABORT, 'ADR revisions are immutable');
	END;

	CREATE TRIGGER adr_revisions_are_permanent BEFORE DELETE ON adr_revisions
	BEGIN
		SELECT RAISE(ABORT, 'ADR revisions cannot be deleted');
	END;

	CREATE VIRTUAL TABLE adr_search USING fts5 (
		title, body, tags,
		content = 'adrs', content_rowid = 'id',
		tokenize = 'unicode61 remove_diacritics 2'
	);

	CREATE TRIGGER adrs_search_insert AFTER INSERT ON adrs
	BEGIN
		INSERT INTO adr_search (rowid, title, body, tags) VALUES (new.id, new.title, new.body, new.tags);
	END;

	CREATE TRIGGER adrs_search_update AFTER UPDATE OF title, body, tags ON adrs
	BEGIN
		INSERT INTO adr_search (adr_search, rowid, title, body, tags)
		VALUES ('delete', old.id, old.title, old.body, old.tags);
		INSERT INTO adr_search (rowid, title, body, tags) VALUES (new.id, new.title, new.body, new.tags);
	END;
	`
];
