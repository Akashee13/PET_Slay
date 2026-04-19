export type NotificationPlatform = "ios" | "android" | "web";

export type DeviceTokenPayload = {
  provider: string;
  token: string;
  platform: NotificationPlatform;
};

export type BuyerNotificationReadiness = {
  ready: boolean;
  reason: "ready" | "permission_denied" | "token_unavailable" | "registration_failed";
  token?: string;
};

export type DeviceTokenProvider = () => Promise<DeviceTokenPayload | null>;

export class NotificationsService {
  private readonly apiBaseUrl: string;
  private readonly tokenProvider: DeviceTokenProvider;

  constructor(apiBaseUrl: string, tokenProvider: DeviceTokenProvider) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, "");
    this.tokenProvider = tokenProvider;
  }

  async registerDeviceToken(sessionToken: string): Promise<{ created: boolean; token: string }> {
    const payload = await this.tokenProvider();
    if (!payload) {
      throw new Error("token_unavailable");
    }

    const response = await fetch(`${this.apiBaseUrl}/v1/buyers/device-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("registration_failed");
    }

    const body = (await response.json()) as { token?: string };
    return {
      created: response.status === 201,
      token: body.token ?? payload.token,
    };
  }

  async getBuyerNotificationReadiness(sessionToken: string): Promise<BuyerNotificationReadiness> {
    try {
      const registration = await this.registerDeviceToken(sessionToken);
      return {
        ready: true,
        reason: "ready",
        token: registration.token,
      };
    } catch (error) {
      if (error instanceof Error && error.message === "token_unavailable") {
        return { ready: false, reason: "token_unavailable" };
      }

      return { ready: false, reason: "registration_failed" };
    }
  }
}
