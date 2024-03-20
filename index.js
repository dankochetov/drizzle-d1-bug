// @ts-check
import { getPlatformProxy } from 'wrangler';
import { drizzle } from 'drizzle-orm/d1';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { eq, sql } from 'drizzle-orm';
import util from 'util';

export const users = sqliteTable('user', {
	id: text('id').notNull().primaryKey(),
	name: text('name').notNull(),
});

export const sessions = sqliteTable('session', {
	id: text('id').notNull().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: integer('expires_at').notNull(),
});

const platform = await getPlatformProxy();
/** @type {D1Database} */
// @ts-ignore
const d1 = platform.env.DB;

const db = drizzle(d1, { logger: true });

await db.run(sql`DROP TABLE IF EXISTS session`);
await db.run(sql`DROP TABLE IF EXISTS user`);

await db.run(
	sql`CREATE TABLE user (id text PRIMARY KEY NOT NULL, name text NOT NULL)`,
);

await db.run(sql`CREATE TABLE session (\n
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL,
  expires_at integer NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON UPDATE NO ACTION ON DELETE NO ACTION
)`);

await db.insert(users).values({
	id: 'user-id-1',
	name: 'Alice',
});

await db.insert(sessions).values({
	id: 'session-id-1',
	userId: 'user-id-1',
	expiresAt: 123456,
});

const result = await db
	.select({
		user: users,
		session: sessions,
	})
	.from(sessions)
	.innerJoin(users, eq(sessions.userId, users.id))
	.where(eq(sessions.id, 'session-id-1'))
	.get();

console.log(JSON.stringify(result, null, 2));

const resultRaw = await d1
	.prepare(
		'select "user"."id", "user"."name", "session"."id", "session"."user_id", "session"."expires_at" from session inner join user on session.user_id = user.id where session.id = ?',
	)
	.bind('session-id-1')
	.raw({ columnNames: true });

console.log(util.inspect(resultRaw, { depth: null, colors: true }));
