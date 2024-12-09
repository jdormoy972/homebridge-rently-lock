import type { CharacteristicValue, PlatformAccessory, PlatformConfig, Service } from 'homebridge';

import type { ExampleHomebridgePlatform } from './platform.ts';
import { login, fetchLockState, setLockState } from './api.js';

import axios from 'axios';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private service: Service;
  token: any;
  deviceId: any;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.accessory.context.device.manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.model_number)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.model_number)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.accessory.context.device.exampleDisplayName);

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory

    if (accessory.context.device.CustomService) {
      // This is only required when using Custom Services and Characteristics not support by HomeKit
      this.service = this.accessory.getService(this.platform.CustomServices[accessory.context.device.CustomService]) ||
        this.accessory.addService(this.platform.CustomServices[accessory.context.device.CustomService]);
    } else {
      this.service = this.accessory.getService(this.platform.Service.LockMechanism) || this.accessory.addService(this.platform.Service.LockMechanism);
    }

    // this.storeDeviceId();
    this.deviceId = accessory.context.device.id;
    this.platform.log.debug(`Fetched device ID: ${this.deviceId}`);
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.handleLockCurrentStateGet.bind(this)); // GET - bind to the `getOn` method below

    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onGet(this.handleLockTargetStateGet.bind(this)) // GET - bind to the `getOn` method below
      .onSet(this.handleLockTargetStateSet.bind(this)); // SET - bind to the `setOn` method below


  }


  // async storeDeviceId() {
  //   this.token = await login(this.platform.config);
  //   const propertyId = await fetchPropertyId(this.token);
  //   this.platform.log.debug(`Fetched new property ID: ${propertyId}`);

  //   const deviceId = await fetchDeviceId(this.token, propertyId);

  //   this.deviceId = deviceId;
  //   this.platform.log.debug(`Fetched device ID: ${this.deviceId}`);
  // }

  async handleLockCurrentStateGet() {
    this.token = await login(this.platform.config);

    const lockState = await fetchLockState(this.token, this.deviceId);
    this.platform.log.debug(`Lock state: ${lockState}`);
    this.platform.log.debug(`Lock Actual state: ${lockState === 'locked' ? this.platform.Characteristic.LockCurrentState.SECURED : this.platform.Characteristic.LockCurrentState.UNSECURED}`);
    return lockState === 'locked' ? this.platform.Characteristic.LockCurrentState.SECURED : this.platform.Characteristic.LockCurrentState.UNSECURED;
  }

  async handleLockTargetStateGet() {
    this.token = await login(this.platform.config);
    const lockState = await fetchLockState(this.token, this.deviceId);

    this.platform.log.debug(`Lock state: ${lockState}`);
    this.platform.log.debug(`Lock Actual state: ${lockState === 'locked' ? this.platform.Characteristic.LockCurrentState.SECURED : this.platform.Characteristic.LockCurrentState.UNSECURED}`);
    return lockState === 'locked' ? this.platform.Characteristic.LockCurrentState.SECURED : this.platform.Characteristic.LockCurrentState.UNSECURED;
  }

  async handleLockTargetStateSet(value: CharacteristicValue) {
    this.token = await login(this.platform.config);
    const command = value === this.platform.Characteristic.LockTargetState.UNSECURED ? 'unlock' : 'lock';

    this.platform.log.debug(`Setting lock state to ${command}`);
    await setLockState(this.token, this.deviceId, command);

    // Update the lock state based on the command
    if (command === 'lock') {
      this.platform.log.debug('Setting lock state to SECURED');
      this.service.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this.platform.Characteristic.LockCurrentState.SECURED);
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else if (command === 'unlock') {
      this.platform.log.debug('Setting lock state to UNSECURED');
      this.service.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this.platform.Characteristic.LockCurrentState.UNSECURED);
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      this.platform.log.error('Invalid command');
    }

    // Fetch the updated lock state after setting the lock state
    const updatedLockState = await fetchLockState(this.token, this.deviceId);
    this.platform.log.debug(`Updated lock state: ${updatedLockState}`);

    // Update the target state based on the updated lock state
    const targetState = updatedLockState === 'locked' ? this.platform.Characteristic.LockTargetState.SECURED : this.platform.Characteristic.LockTargetState.UNSECURED;
    this.service.updateCharacteristic(this.platform.Characteristic.LockTargetState, targetState);
  }
}