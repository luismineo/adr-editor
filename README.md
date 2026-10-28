# ADR Editor

A small, fast, local editor to write, organize and version [Architecture Decision Records](https://adr.github.io/).

- **Projects** group your ADRs. The dashboard shows how many decisions each project has per status.
- **Automatic numbering and metadata.** Each ADR gets a sequential, never-reused number per project (`ADR-0001`), timestamps, status, tags, deciders and supersede links.
- **Templates.** Start from [MADR](https://adr.github.io/madr/), [Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), Y-Statement or a blank page.
- **Markdown editor** with live preview (write, split or preview mode) and `Ctrl/Cmd + S` to save.
- **Revision history.** Every save is stored as an immutable revision with an optional change note. Compare revisions side by side and restore any of them; restoring creates a new revision, so nothing is ever lost.
- **Full-text search** across all projects (press `/` anywhere).
- **Export** a single ADR or a whole project as Markdown files with YAML front matter, named like [adr-tools](https://github.com/npryce/adr-tools) does (`0001-use-postgresql.md`).
- **No deletes.** Projects and ADRs can be archived and unarchived.

All data lives in a single SQLite file on your disk.

## Requirements

- Node.js 22.17 or newer. SQLite comes built in through [`node:sqlite`](https://nodejs.org/api/sqlite.html), so there is no database to install.

## Getting started

```sh
npm install
npm run build
npm start
```

Then open <http://localhost:3000>.

For development with hot reload:

```sh
npm run dev
```

## Docker

```sh
docker compose up -d --build
```

The database is kept in the `adr-data` volume. The port is published on `127.0.0.1` only, and because the server checks the `Host` header, the host and container ports must match. To use another port, set `PORT` rather than editing the mapping:

```sh
PORT=4000 docker compose up -d
```

## Configuration

| Variable      | Default       | Description                           |
| ------------- | ------------- | ------------------------------------- |
| `ADR_DB_PATH` | `data/adr.db` | Location of the SQLite database file. |
| `PORT`        | `3000`        | Port the server listens on.           |
| `HOST`        | `127.0.0.1`   | Interface the server binds to.        |

```sh
ADR_DB_PATH=~/Documents/adrs.db PORT=4000 npm start
```

The server only answers requests addressed to `localhost`, `127.0.0.1` or the configured `HOST`, which keeps other websites from reaching it through DNS rebinding.

## Backups

The database is a regular SQLite file. To back it up, copy `data/adr.db` while the app is stopped, or run `sqlite3 data/adr.db ".backup adr-backup.db"` while it is running. The project export (a zip of Markdown files) is also a good way to keep decisions in a Git repository next to your code.

## How versioning works

| Table           | Purpose                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `projects`      | Projects and their default template.                                     |
| `adrs`          | The current state of each ADR, used for fast listing and search.         |
| `adr_revisions` | One row per saved change. Triggers reject any `UPDATE` or `DELETE` here. |
| `adr_search`    | FTS5 index over the current title, body and tags.                        |

Saving an ADR compares the new content with the current one. When something changed, the `adrs` row is updated and a full snapshot is appended to `adr_revisions` in the same transaction. Saves carry the revision they were based on, so two browser tabs cannot silently overwrite each other.

Schema changes go in `src/lib/server/migrations.ts` and are applied on startup using SQLite's `user_version`.

## Project structure

```
server.js                  Production entry point (local HTTP server)
src/lib/adr.ts             Shared types, statuses and formatting helpers
src/lib/templates.ts       ADR templates
src/lib/diff.ts            Line diff with collapsed context
src/lib/server/            Database, repositories and Markdown export
src/lib/components/        Editor, preview, diff and other UI components
src/routes/                Pages and form actions (SvelteKit)
```

## Tech stack

[SvelteKit](https://svelte.dev/docs/kit) · [Svelte 5](https://svelte.dev) · [Flowbite Svelte](https://flowbite-svelte.com) · [Tailwind CSS](https://tailwindcss.com) · [CodeMirror](https://codemirror.net) · SQLite (`node:sqlite`)

## Scripts

| Command          | Description                   |
| ---------------- | ----------------------------- |
| `npm run dev`    | Start the development server. |
| `npm run build`  | Build the production bundle.  |
| `npm start`      | Run the production build.     |
| `npm test`       | Run the unit tests.           |
| `npm run check`  | Type-check the project.       |
| `npm run lint`   | Check formatting.             |
| `npm run format` | Format the code.              |
