import wretch, { Wretch } from "wretch";
import { WretchError } from "wretch/resolver";
import {
  AuthResponse,
  DeviceListResponse,
  LockTargetStateGetResponse,
  RentlyLock,
  SetLockStateResponse,
} from "../types";

const LOGIN_URL = "https://remotapp.rently.com/oauth/token/";
const BASE_URL = "https://app2.keyless.rocks/api/";
const ENDPOINTS = {
  PROPERTIES: "properties",
  PROPERTY_DEVICES(propertyId: number) {
    return this.PROPERTIES + propertyId + "/devices";
  },
  DEVICE(id: string) {
    return "devices/" + id;
  },
};

export class RentlyAPI {
  private email: string;
  private password: string;
  private rentlyApi = wretch(BASE_URL).catcher(401, this.handleUnauthorized);

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }

  /**
   * Login to the Rently API
   * @example
   * ```ts
   * const api = new RentlyAPI("email@example.com", "password");
   * await api.login();
   * ```
   */
  async login() {
    const response: AuthResponse = await wretch(LOGIN_URL)
      .post({
        email: this.email,
        password: this.password,
      })
      .unauthorized((err: WretchError) => {
        console.log(err.message);
      })
      .json();

    if (!response.success) {
      throw new Error(`Login failed: ${response.message}`);
    }

    this.rentlyApi = wretch(BASE_URL)
      .auth(response.access_token)
      .catcher(401, this.handleUnauthorized);
  }

  async handleUnauthorized(error: WretchError, req: Wretch) {
    console.log(error.message);
    // Renew credentials
    await this.login();
    // Replay the original request with new credentials
    return req
      .fetch()
      .unauthorized((err: WretchError) => {
        console.log(err.message);
        // throw err;
      })
      .json();
  }

  async getPropertyIDs() {
    type PropertyIDResponse = { properties: { id: number }[] };
    const response = await this.rentlyApi
      .get(ENDPOINTS.PROPERTIES)
      .json<PropertyIDResponse>();
    return response.properties.map(({ id }) => id);
  }

  // Just get all locks for now
  async getAllPropertyDevices() {
    const rentlyLocks: RentlyLock[] = [];
    const propertyIDs = await this.getPropertyIDs();

    // Can be optimized with Promise.allSettled later, but there is
    // most likely going to be only a single property ID so it's fine
    for (const propertyId of propertyIDs) {
      const response = await this.rentlyApi
        .get(ENDPOINTS.PROPERTY_DEVICES(propertyId))
        .json<DeviceListResponse>();

      response.lock.forEach((lock: RentlyLock) => rentlyLocks.push(lock));
    }

    return rentlyLocks;
  }

  async getLockedState(doorLockId: string) {
    const response = await this.rentlyApi
      .get(ENDPOINTS.DEVICE(doorLockId))
      .json<LockTargetStateGetResponse>();
    return response.status.mode.type === "locked";
  }

  async setLockedState(doorLockId: string, value: boolean) {
    const command = value ? "lock" : "unlock";
    const response = await this.rentlyApi
      .url(ENDPOINTS.DEVICE(doorLockId))
      .put({ commands: { mode: command } })
      .json<SetLockStateResponse>();
    return response;
  }
}
