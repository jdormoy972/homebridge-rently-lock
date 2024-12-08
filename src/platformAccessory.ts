import type { CharacteristicValue, PlatformAccessory, PlatformConfig, Service } from 'homebridge';

import type { ExampleHomebridgePlatform } from './platform.ts';
import { login } from './api.js';

import axios from 'axios';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private service: Service;
  token: any;
  // config: any;
  deviceId: any;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    // public readonly config: PlatformConfig,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory

    if (accessory.context.device.CustomService) {
      // This is only required when using Custom Services and Characteristics not support by HomeKit
      this.service = this.accessory.getService(this.platform.CustomServices[accessory.context.device.CustomService]) ||
        this.accessory.addService(this.platform.CustomServices[accessory.context.device.CustomService]);
    } else {
      this.service = this.accessory.getService(this.platform.Service.LockMechanism) || this.accessory.addService(this.platform.Service.LockMechanism);
    }

    this.fetchDeviceId();
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


  // async login() {
  //   // const { email, password } = this.config;
  //   const response = await axios.post('https://remotapp.rently.com/oauth/token', {
  //     email: this.platform.config.email,
  //     password: this.platform.config.password,
  //   });
  //   this.token = response.data.access_token;
  //   this.platform.log.debug(`Fetched token: ${this.token}`);

  //   this.platform.log.debug(`Config: ${this.platform.config.email}`);
  // }

  async fetchDeviceId() {
    await login(this);

    const response_ = await axios.get('https://app2.keyless.rocks/api/properties?search_key=&page=1&keyless_app=true&per_page=100&account=&root_community_id=', {
      headers: { Authorization: `${this.token}` }
    });
    const propertyId = response_.data.properties[0].id;
    this.platform.log.debug(`Fetched property ID: ${propertyId}`);

    const response = await axios.get(`https://app2.keyless.rocks/api/properties/${propertyId}/assetsDeviceDetails`, {
      headers: { Authorization: `${this.token}` }
    });

    this.platform.log.debug(`Fetched device ID: ${response.data}`);
    this.deviceId = response.data.devices.locks[0].id;
    this.platform.log.debug('stored device ID:', this.deviceId);
    this.platform.log.debug(`Fetched device ID: ${this.deviceId}`);
  }

  async handleLockCurrentStateGet() {
    await login(this);
    const deviceId = this.deviceId;
    const response = await axios.get(`https://app2.keyless.rocks/api/devices/${deviceId}`, {
      headers: { Authorization: `${this.token}` }
    });

    this.platform.log.debug(`Lock state: ${response.data.status.mode.type}`);
    this.platform.log.debug(`Lock Actual state: ${response.data.status.mode.type === 'locked' ? this.platform.Characteristic.LockCurrentState.SECURED : this.platform.Characteristic.LockCurrentState.UNSECURED}`);
    return response.data.status.mode.type === 'locked' ? this.platform.Characteristic.LockCurrentState.SECURED : this.platform.Characteristic.LockCurrentState.UNSECURED;
  }

  async handleLockTargetStateGet() {
    await login(this);
    const deviceId = this.deviceId;
    const response = await axios.get(`https://app2.keyless.rocks/api/devices/${deviceId}`, {
      headers: { Authorization: `${this.token}` }
    });

    this.platform.log.debug(`Lock state: ${response.data.status.mode.type}`);
    this.platform.log.debug(`Lock Actual state: ${response.data.status.mode.type === 'locked' ? this.platform.Characteristic.LockCurrentState.SECURED : this.platform.Characteristic.LockCurrentState.UNSECURED}`);
    return response.data.status.mode.type === 'locked' ? this.platform.Characteristic.LockCurrentState.SECURED : this.platform.Characteristic.LockCurrentState.UNSECURED;
  }

  async handleLockTargetStateSet(value: CharacteristicValue) {
    await login(this);
    const command = value === this.platform.Characteristic.LockTargetState.UNSECURED ? 'unlock' : 'lock';
    const deviceId = this.deviceId;

    await axios.put(`https://app2.keyless.rocks/api/devices/${deviceId}`, { commands: { mode: command } }, {
      headers: { Authorization: `${this.token}` }
    });

    // Update the lock state based on the command
    if (command === 'lock') {
      this.platform.log.debug('Setting lock state to SECURED');
      this.service.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this.platform.Characteristic.LockCurrentState.SECURED);
    } else if (command === 'unlock') {
      this.platform.log.debug('Setting lock state to UNSECURED');
      this.service.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this.platform.Characteristic.LockCurrentState.UNSECURED);
    } else {
      this.platform.log.error('Invalid command');
    }
  }
}