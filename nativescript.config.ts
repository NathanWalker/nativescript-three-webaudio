import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.nativescript.threejswebaudio',
  appPath: 'src',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc --allow-natives-syntax --turbo-fast-api-calls',
    markingMode: 'none',
    discardUncaughtJsExceptions: true
  },
  ios: {
    discardUncaughtJsExceptions: true
  }
} as NativeScriptConfig;