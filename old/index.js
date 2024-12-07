const axios = require('axios');

module.exports = (api) => {
  api.registerAccessory('LockMechanism', LockMechanism);
};

class LockMechanism {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    this.lockService = new this.Service.LockMechanism(this.config.name);

    this.lockService.getCharacteristic(this.Characteristic.LockCurrentState)
      .onGet(this.handleLockTargetStateGet.bind(this));

    this.lockService.getCharacteristic(this.Characteristic.LockTargetState)
      .onGet(this.handleLockTargetStateGet.bind(this))
      .onSet(this.handleLockTargetStateSet.bind(this));

    this.fetchDeviceId();
  }

  getServices() {
    return [this.lockService];
  }

  async login() {
    const { email, password } = this.config;
    const response = await axios.post('https://remotapp.rently.com/oauth/token', {
      email: email,
      password: password
    });
    this.token = response.data.access_token;
  }
  async fetchDeviceId() {
    await this.login();

    const response_ = await axios.get('https://app2.keyless.rocks/api/properties?search_key=&page=1&keyless_app=true&per_page=100&account=&root_community_id=', {
      headers: { Authorization: `${this.token}` }
    });
    const propertyId = response_.data.properties[0].id;
    this.log(`Fetched property ID: ${propertyId}`);

    const response = await axios.get(`https://app2.keyless.rocks/api/properties/${propertyId}/assetsDeviceDetails`, {
      headers: { Authorization: `${this.token}` }
    });

    this.config.deviceId = response.data.devices.locks[0].id;
    this.log(`Fetched device ID: ${this.config.deviceId}`);
  }

  async handleLockTargetStateGet() {
    await this.login();
    const deviceId = this.config.deviceId;
    const response = await axios.get(`https://app2.keyless.rocks/api/devices/${deviceId}`, {
      headers: { Authorization: `${this.token}` }
    });

    this.log(`Lock state: ${response.data.status.mode.type}`);
    return response.data.status.mode.type === 'locked' ? this.Characteristic.LockCurrentState.SECURED : this.Characteristic.LockCurrentState.UNSECURED;
  }

  async handleLockTargetStateSet(value) {
    await this.login();
    const command = value === this.Characteristic.LockTargetState.SECURED ? 'lock' : 'unlock';
    const deviceId = this.config.deviceId;

    await axios.put(`https://app2.keyless.rocks/api/devices/${deviceId}`, { commands: { mode: command } }, {
      headers: { Authorization: `${this.token}` }
    });

    // Update the lock state based on the command
    if (command === 'lock') {
      this.lockService.updateCharacteristic(this.Characteristic.LockCurrentState, this.Characteristic.LockCurrentState.SECURED);
    } else if (command === 'unlock') {
      this.lockService.updateCharacteristic(this.Characteristic.LockCurrentState, this.Characteristic.LockCurrentState.UNSECURED);
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}