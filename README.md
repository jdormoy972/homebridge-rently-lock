# Homebridge Rently Smart Lock Plugin

This Homebridge plugin allows you to control your door lock controled the Rently app using HomeKit.

## Completion

**This plugin is still in devwlopment.**

## Features

- Seamless door lock integration with the HomeKit
- Control your door lock directly from the Home app

## Installation

To install the plugin, use the following command:

- Add this directory to /var/lib/homebridge/node_modules on your HomeBridge device.
- Update the config file as described below in **Basic Configuration**

## Basic Configuration

To configure the plugin, you need to use your email and password for the Rently app. Add the following configuration to the Homebridge Config Editor:

```json
{
  "accessories": [
    {
      "accessory": "LockMechanism",
      "name": "My Lock",
      "email": "your-email@email.com",
      "password": "your-password"
    }
  ]
}
```

Replace `"your-email@email.com"` and `"your-password"` with your actual Rently app email and password.

## Usage

Once configured, you can control your door lock using the Home app on your iOS device. You can open or close the lock as well as viewing the current state of the lock.

## TODO List

- [ ] Fetch the device ID automatically
- [ ] Publish the plugin to npm
- [ ] Add support for multiple door locks
- [ ] Improve error handling and logging
- [ ] Add unit tests

## Contributing

We welcome contributions! Please fork the repository and submit pull requests with your improvements.

## License

This project is licensed under the MIT License.

---

Feel free to reach out if you have any questions or need further assistance. Enjoy controlling your door lock with Homebridge and the Rently app!
