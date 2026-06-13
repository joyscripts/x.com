import { eq, sql } from "drizzle-orm";
import type { RegisterDeviceInstallationRequest } from "@repo/contracts";
import { db } from "@/db/client";
import {
  deviceInstallations,
  type DeviceInstallationRow,
} from "@/db/schema";

export interface DeviceInstallationRepository {
  upsertInstallation(
    input: RegisterDeviceInstallationRequest,
  ): Promise<DeviceInstallationRow>;
  listInstallationsByUserId(userId: string): Promise<DeviceInstallationRow[]>;
}

export class DrizzleDeviceInstallationRepository
  implements DeviceInstallationRepository
{
  async upsertInstallation(
    input: RegisterDeviceInstallationRequest,
  ): Promise<DeviceInstallationRow> {
    const [installation] = await db
      .insert(deviceInstallations)
      .values({
        installationId: input.installationId,
        userId: input.userId ?? null,
        platform: input.platform,
        pushProvider: input.pushProvider,
        deviceToken: input.deviceToken,
        appVariant: input.appVariant,
        appVersion: input.appVersion ?? null,
        deviceName: input.deviceName ?? null,
        deviceModel: input.deviceModel ?? null,
        osVersion: input.osVersion ?? null,
      })
      .onConflictDoUpdate({
        target: deviceInstallations.installationId,
        set: {
          userId: input.userId ?? null,
          platform: input.platform,
          pushProvider: input.pushProvider,
          deviceToken: input.deviceToken,
          appVariant: input.appVariant,
          appVersion: input.appVersion ?? null,
          deviceName: input.deviceName ?? null,
          deviceModel: input.deviceModel ?? null,
          osVersion: input.osVersion ?? null,
          updatedAt: sql`now()`,
          lastRegisteredAt: sql`now()`,
        },
      })
      .returning();

    return installation;
  }

  async listInstallationsByUserId(
    userId: string,
  ): Promise<DeviceInstallationRow[]> {
    return db
      .select()
      .from(deviceInstallations)
      .where(eq(deviceInstallations.userId, userId));
  }
}
