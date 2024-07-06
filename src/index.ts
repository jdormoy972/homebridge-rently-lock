import { API } from "homebridge";

import { HomebridgeRentlyLock } from "homebridge-rently-lock/src/platform.js";
import { PLATFORM_NAME } from "homebridge-rently-lock/src/settings.js";

/**
 * This method registers the platform with Homebridge
 */
export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, HomebridgeRentlyLock);
};
