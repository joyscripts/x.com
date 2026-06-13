import type {
  RegisterDeviceInstallationRequest,
  RegisterDeviceInstallationResponse,
} from "@repo/contracts";
import type { DeviceInstallationRepository } from "@/modules/device-installations/device-installations.repository";

export interface DeviceInstallationServicePort {
  registerInstallation(
    input: RegisterDeviceInstallationRequest,
  ): Promise<RegisterDeviceInstallationResponse>;
}

export class DeviceInstallationService
  implements DeviceInstallationServicePort
{
  constructor(
    private readonly repository: DeviceInstallationRepository,
  ) {}

  async registerInstallation(
    input: RegisterDeviceInstallationRequest,
  ): Promise<RegisterDeviceInstallationResponse> {
    const installation = await this.repository.upsertInstallation(input);

    return {
      status: "registered",
      installation: {
        installationId: installation.installationId,
        userId: installation.userId,
        platform: input.platform,
        pushProvider: input.pushProvider,
        deviceToken: installation.deviceToken,
        appVariant: installation.appVariant,
        appVersion: installation.appVersion,
        deviceName: installation.deviceName,
        deviceModel: installation.deviceModel,
        osVersion: installation.osVersion,
        createdAt: installation.createdAt.toISOString(),
        updatedAt: installation.updatedAt.toISOString(),
        lastRegisteredAt: installation.lastRegisteredAt.toISOString(),
      },
    };
  }
}
