# Homebridge Rently Smart Lock Plugin

This Homebridge plugin allows you to control your door lock controlled by the [Rently app](https://rently.com/) using HomeKit.

## Completion

**This plugin is still in development.**
See [TODO list](#todo-list). Lots of items need to be done before getting the plugin validated.

In early developments, I used the Tools **Charles** to view all API calls made by the app. I was then able to pick up which endpoints were used to control the devices. Now we need to figure out which endpoint returns the list of devices based on the user account.

I am a TypeScript noob... Don't judge

## Features

- Seamless door lock integration with HomeKit
- Control your door lock directly from the Home app

## Installation

To install the plugin, use the following command:

- Search from HomeBridge UI page
- Or run the following command: `npm i homebridge-rently-lock`

## Basic Configuration

To configure the plugin, you need to use your email and password for the Rently app. Add the following configuration to the plugin Config Editor when prompted or:

```json
{    "platforms": [
  {
      "name": "Rently Lock Plugin",
      "email": "youremail@example.com",
      "password": "yourPassword",
      "platform": "RentlyHomebridgePlugin"
  }
    ]}
    ```

Replace `"youremail@example.com"` and `"yourPassword"` with your actual Rently app email and password.

## Usage

Once configured, you can control your door lock using the Home app on your iOS device. You can open or close the lock as well as view the current state of the lock.

## TODO List

- [x] Fetch the device ID automatically
- [x] Publish the plugin to npm
- [ ] Refactor a few TypeScript scripts
- [ ] When the status of the lock is changed, update the lock status on the Homebridge side based on the response
- [ ] Add support for multiple door locks
- [ ] Add error handling and logging
- [ ] Add thermostat and other accessories

## Contributing

We welcome contributions! Please fork the repository and submit pull requests with your improvements.

## License

This project is licensed under the MIT License.

---

Feel free to reach out if you have any questions or need further assistance. Enjoy controlling your door lock with Homebridge and the Rently app!

Special thanks to [andromidasj](https://github.com/andromidasj).