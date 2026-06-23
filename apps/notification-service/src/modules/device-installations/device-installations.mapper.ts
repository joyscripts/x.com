import {
  deviceInstallationSchema,
  type DeviceInstallation,
} from "@repo/contracts";
import type { DeviceInstallationRow } from "@/db/schema";

export function toRegisteredDeviceInstallationDto(
  installation: DeviceInstallationRow,
): DeviceInstallation {
  return deviceInstallationSchema.parse({
    installationId: installation.installationId,
    userId: installation.userId,
    platform: installation.platform,
    pushProvider: installation.pushProvider,
    deviceToken: installation.deviceToken,
    appVariant: installation.appVariant,
    appVersion: installation.appVersion,
    deviceName: installation.deviceName,
    deviceModel: installation.deviceModel,
    osVersion: installation.osVersion,
    createdAt: installation.createdAt.toISOString(),
    updatedAt: installation.updatedAt.toISOString(),
    lastRegisteredAt: installation.lastRegisteredAt.toISOString(),
  });
}
