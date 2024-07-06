import {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from "homebridge";

import { RentlyLockAccessory } from "homebridge-rently-lock/src/platformAccessory.js";
import { RentlyAPI } from "homebridge-rently-lock/src/rently-api/RentlyAPI.js";
import { PLATFORM_NAME, PLUGIN_NAME } from "homebridge-rently-lock/src/settings.js";
import { RentlyLock } from "homebridge-rently-lock/src/types.js";

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HomebridgeRentlyLock implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly RentlyAPI: RentlyAPI;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory<RentlyLock>[] = [];

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;
    this.RentlyAPI = new RentlyAPI(this.config.email, this.config.password);

    this.log.debug("Finished initializing platform:", this.config.name);

    // Homebridge 1.8.0 introduced a `log.success` method that can be used to log success messages
    // For users that are on a version prior to 1.8.0, we need a 'polyfill' for this method
    if (!log.success) {
      log.success = log.info;
    }

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on("didFinishLaunching", () => {
      log.debug("Executed didFinishLaunching callback");
      // run the method to discover / register your devices as accessories
      this.registerLocks();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory<RentlyLock>) {
    this.log.info("Loading accessory from cache:", accessory.displayName);

    // add the restored accessory to the accessories cache, so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  async registerLocks() {
    this.log.info("Registering locks");

    await this.RentlyAPI.login();

    const rentlyLocks = await this.RentlyAPI.getAllPropertyDevices();

    for (const rentlyLock of rentlyLocks) {
      const uuid = this.api.hap.uuid.generate(rentlyLock.id);
      const existingAccessory = this.accessories.find(
        (accessory) => accessory.UUID === uuid
      );

      if (existingAccessory) {
        // the accessory already exists
        this.log.info(
          "Restoring existing accessory from cache:",
          existingAccessory.displayName
        );

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. e.g.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new RentlyLockAccessory(this, existingAccessory, this.RentlyAPI);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, e.g.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info("Adding new accessory:", rentlyLock.device_name);

        // create a new accessory
        const accessory: PlatformAccessory<RentlyLock> =
          new this.api.platformAccessory(rentlyLock.device_name, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context = rentlyLock;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new RentlyLockAccessory(this, accessory, this.RentlyAPI);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ]);
      }
    }
  }
}
