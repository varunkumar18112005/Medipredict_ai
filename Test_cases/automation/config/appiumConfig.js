const path = require('path');

module.exports = {
  hostname: 'localhost',
  port: 4723,
  path: '/wd/hub',
  capabilities: {
    platformName: 'Android',
    'appium:deviceName': 'Android Emulator',
    'appium:automationName': 'UiAutomator2',
    'appium:app': path.join(__dirname, '..', '..', 'medipredict_ai_frontend', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    'appium:appPackage': 'com.medipredict.ai',
    'appium:appActivity': '.MainActivity',
    'appium:newCommandTimeout': 300,
    'appium:autoGrantPermissions': true
  }
};
