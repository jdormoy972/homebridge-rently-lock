import { CharacteristicValue, PlatformAccessory, Service } from "homebridge";

import { HomebridgeRentlyLock } from "./platform.js";
import { RentlyAPI } from "./rently-api/RentlyAPI.js";
import { RentlyLock } from "./types.js";

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class RentlyLockAccessory {
  private service: Service;

  constructor(
    private readonly platform: HomebridgeRentlyLock,
    private readonly accessory: PlatformAccessory<RentlyLock>,
    private RentlyApi: RentlyAPI
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, "Rently")
      .setCharacteristic(
        this.platform.Characteristic.Model,
        this.accessory.context.device_type
      )
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.accessory.context.id
      );

    // get the LockMechanism service if it exists, otherwise create a new LockMechanism service
    this.service =
      this.accessory.getService(this.platform.Service.LockMechanism) ||
      this.accessory.addService(this.platform.Service.LockMechanism);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.context.device_name
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onSet(this.setLockedState.bind(this)) // SET - bind to the matching method below
      .onGet(this.getLockedState.bind(this)); // GET - bind to the matching method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setLockedState(value: CharacteristicValue) {
    this.RentlyApi.setLockedState(this.accessory.context.id, value as boolean);
    this.platform.log.debug("Set Characteristic Locked ->", value);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possible. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getLockedState(): Promise<CharacteristicValue> {
    const isLocked = await this.RentlyApi.getLockedState(
      this.accessory.context.id
    );

    this.platform.log.debug("Get Characteristic IsLocked ->", isLocked);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isLocked;
  }
}
