import type { ColumnType, Generated } from "kysely";

/** Postgres timestamptz — selected as a Date, serialized as ISO text to the client. */
export type Timestamptz = ColumnType<Date, Date | string | undefined, Date | string>;

/** Better Auth user row — columns read by the auth layer. */
export interface UserTable {
  id: string;
  email: string | null;
  name: string | null;
}

export interface ItemsTable {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: string;
  created_at: Generated<Timestamptz>;
  updated_at: Timestamptz;
}

export interface Database {
  user: UserTable;
  items: ItemsTable;
}
