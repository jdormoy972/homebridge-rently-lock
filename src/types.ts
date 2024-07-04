export type AuthResponse =
  | {
      success: true;
      access_token: string;
    }
  | {
      success: false;
      message: string;
    };

export type SetLockStateResponse = {
  success: boolean;
  message: string;
};

export type RentlyLockList = {
  id: string;
  name: string;
  devices: RentlyLock[];
};

export type RentlyLock = {
  id: string;
  device_name: string;
  occupant_setting: string;
  device_type: string;
  iot_thing_name: string;
  topic_name: string;
};

export type DeviceListResponse = {
  lock: RentlyLock[];
};

export type LockTargetStateGetResponse = {
  status: {
    mode: {
      type: "locked" | "unlocked";
    };
  };
};
