import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { users, type UserRow } from "@/db/schema";

export interface UsersRepository {
  findById(id: string): Promise<UserRow | undefined>;
  findByHandle(handle: string): Promise<UserRow | undefined>;
  findByPhoneNumber(phoneNumber: string): Promise<UserRow | undefined>;
  create(input: {
    phoneNumber: string;
    handle: string;
    displayName: string;
  }): Promise<UserRow>;
  updateProfile(
    id: string,
    input: {
      handle: string;
      displayName: string;
      bio: string | null;
      avatarUrl: string | null;
    },
  ): Promise<UserRow | undefined>;
}

export class DrizzleUsersRepository implements UsersRepository {
  async findById(id: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  }

  async findByPhoneNumber(phoneNumber: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber))
      .limit(1);

    return user;
  }

  async findByHandle(handle: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.handle, handle))
      .limit(1);

    return user;
  }

  async create(input: {
    phoneNumber: string;
    handle: string;
    displayName: string;
  }) {
    const [user] = await db
      .insert(users)
      .values(input)
      .returning();

    return user;
  }

  async updateProfile(
    id: string,
    input: {
      handle: string;
      displayName: string;
      bio: string | null;
      avatarUrl: string | null;
    },
  ) {
    const [user] = await db
      .update(users)
      .set({
        ...input,
        updatedAt: sql`now()`,
      })
      .where(eq(users.id, id))
      .returning();

    return user;
  }
}
