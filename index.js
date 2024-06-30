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

  async handleLockTargetStateGet() {
    await this.login();
    const response = await axios.get('https://app2.keyless.rocks/api/devices/door-lock-id', {
      headers: { Authorization: `${this.token}` }
    });
    return response.data.status.mode.type === 'locked' ? this.Characteristic.LockCurrentState.SECURED : this.Characteristic.LockCurrentState.UNSECURED;
  }

  async handleLockTargetStateSet(value) {
    await this.login();
    const command = value === this.Characteristic.LockTargetState.SECURED ? 'lock' : 'unlock';
    await axios.put('https://app2.keyless.rocks/api/devices/door-lock-id', { commands: { mode: command } }, {
      headers: { Authorization: `${this.token}` }
    });
  }
}
