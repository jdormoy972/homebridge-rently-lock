import axios from 'axios';

export async function login(config: any) {
    // const { email, password } = this.config;
    const response = await axios.post('https://remotapp.rently.com/oauth/token', {
        email: config.email,
        password: config.password,
    });
    return response.data.access_token;
    // this_.platform.log.debug(`Fetched token: ${this_.token}`);

    // this_.platform.log.debug(`Config: ${this_.platform.config.email}`);
}

export async function fetchPropertyId(token: string): Promise<string> {
    const response = await axios.get('https://app2.keyless.rocks/api/properties?search_key=&page=1&keyless_app=true&per_page=100&account=&root_community_id=', {
        headers: { Authorization: `${token}` }
    });
    return response.data.properties[0].id;
}

export async function fetchDeviceId(token: string, propertyId: string): Promise<string> {
    const response = await axios.get(`https://app2.keyless.rocks/api/properties/${propertyId}/assetsDeviceDetails`, {
        headers: { Authorization: `${token}` }
    });
    return response.data.devices.locks[0].id;
}

export async function fetchLockState(token: string, deviceId: string): Promise<string> {
    const response = await axios.get(`https://app2.keyless.rocks/api/devices/${deviceId}`, {
        headers: { Authorization: `${token}` }
    });
    return response.data.status.mode.type;
}

export async function setLockState(token: string, deviceId: string, command: string) {
    await axios.put(`https://app2.keyless.rocks/api/devices/${deviceId}`, { commands: { mode: command } }, {
        headers: { Authorization: `${token}` }
    });

}

export interface DeviceInfo {
    id: string;
    device_name: string;
    occupant_setting: string;
    // Add other properties if needed
}


export async function fetchDeviceInfo(token: string, propertyId: string): Promise<DeviceInfo[]> {
    const response = await axios.get(`https://app2.keyless.rocks/api/properties/${propertyId}/assetsDeviceDetails`, {
        headers: { Authorization: `${token}` }
    });
    return response.data.devices.locks;
}
