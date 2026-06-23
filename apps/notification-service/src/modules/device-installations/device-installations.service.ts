import type {
  RegisterDeviceInstallationRequest,
  RegisterDeviceInstallationResponse,
} from "@repo/contracts";
import { toRegisteredDeviceInstallationDto } from "@/modules/device-installations/device-installations.mapper";
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
      installation: toRegisteredDeviceInstallationDto(installation),
    };
  }
}
