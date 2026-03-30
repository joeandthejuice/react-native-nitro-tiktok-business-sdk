const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
  withInfoPlist,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const IOS_APP_ID_KEY = 'TikTokAppEventsAppId';
const IOS_TIKTOK_APP_IDS_KEY = 'TikTokAppEventsTikTokAppIds';
const ANDROID_APP_ID_KEY =
  'com.joeandthejuice.react_native_nitro_tiktok_business_sdk.APP_ID';
const ANDROID_TIKTOK_APP_IDS_KEY =
  'com.joeandthejuice.react_native_nitro_tiktok_business_sdk.TIKTOK_APP_IDS';

function normalizeString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeString(entry)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => normalizeString(entry))
      .filter(Boolean);
  }

  return [];
}

function setMetaDataItem(application, name, value) {
  const metaData = application['meta-data'] ?? [];
  const nextMetaData = metaData.filter(
    (entry) => entry.$['android:name'] !== name
  );

  if (value != null) {
    nextMetaData.push({
      $: {
        'android:name': name,
        'android:value': value,
      },
    });
  }

  if (nextMetaData.length === 0) {
    delete application['meta-data'];
    return;
  }

  application['meta-data'] = nextMetaData;
}

function ensureJitPackRepository(contents) {
  if (contents.includes('jitpack.io')) {
    return contents;
  }

  const allProjectsRepositoriesPattern =
    /allprojects\s*\{\s*repositories\s*\{/m;
  if (allProjectsRepositoriesPattern.test(contents)) {
    return contents.replace(allProjectsRepositoriesPattern, (match) => {
      return `${match}\n    maven { url 'https://www.jitpack.io' }`;
    });
  }

  return `${contents}\n\nallprojects {\n  repositories {\n    maven { url 'https://www.jitpack.io' }\n  }\n}\n`;
}

function withAndroidJitPackRepository(config) {
  return withDangerousMod(config, [
    'android',
    async (exportedConfig) => {
      const projectRoot = exportedConfig.modRequest.projectRoot;
      const buildGradlePath = path.join(projectRoot, 'android', 'build.gradle');

      if (!fs.existsSync(buildGradlePath)) {
        return exportedConfig;
      }

      const current = fs.readFileSync(buildGradlePath, 'utf8');
      const updated = ensureJitPackRepository(current);

      if (updated !== current) {
        fs.writeFileSync(buildGradlePath, updated);
      }

      return exportedConfig;
    },
  ]);
}

function ensureUseModularHeaders(contents) {
  if (contents.includes('use_modular_headers!')) {
    return contents;
  }

  const targetPattern = /^target\s+['"][^'"]+['"]\s+do$/m;
  if (targetPattern.test(contents)) {
    return contents.replace(
      targetPattern,
      (match) => `${match}\n  use_modular_headers!`
    );
  }

  return contents;
}

function withIosModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (exportedConfig) => {
      const projectRoot = exportedConfig.modRequest.projectRoot;
      const podfilePath = path.join(projectRoot, 'ios', 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        return exportedConfig;
      }

      const current = fs.readFileSync(podfilePath, 'utf8');
      const updated = ensureUseModularHeaders(current);

      if (updated !== current) {
        fs.writeFileSync(podfilePath, updated);
      }

      return exportedConfig;
    },
  ]);
}

function withIosTikTokDefaults(config, props) {
  return withInfoPlist(config, (configWithInfoPlist) => {
    if (
      props?.iosUserTrackingUsageDescription &&
      !configWithInfoPlist.modResults.NSUserTrackingUsageDescription
    ) {
      configWithInfoPlist.modResults.NSUserTrackingUsageDescription =
        props.iosUserTrackingUsageDescription;
    }

    const iosAppId = normalizeString(props?.iosAppId);
    const iosTikTokAppIds = normalizeStringArray(props?.iosTikTokAppIds);

    if (iosAppId != null) {
      configWithInfoPlist.modResults[IOS_APP_ID_KEY] = iosAppId;
    } else {
      delete configWithInfoPlist.modResults[IOS_APP_ID_KEY];
    }

    if (iosTikTokAppIds.length > 0) {
      configWithInfoPlist.modResults[IOS_TIKTOK_APP_IDS_KEY] =
        iosTikTokAppIds.join(',');
    } else {
      delete configWithInfoPlist.modResults[IOS_TIKTOK_APP_IDS_KEY];
    }

    return configWithInfoPlist;
  });
}

function withAndroidTikTokDefaults(config, props) {
  return withAndroidManifest(config, (configWithAndroidManifest) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      configWithAndroidManifest.modResults
    );

    setMetaDataItem(
      application,
      ANDROID_APP_ID_KEY,
      normalizeString(props?.androidAppId)
    );

    const androidTikTokAppIds = normalizeStringArray(
      props?.androidTikTokAppIds
    );
    setMetaDataItem(
      application,
      ANDROID_TIKTOK_APP_IDS_KEY,
      androidTikTokAppIds.length > 0 ? androidTikTokAppIds.join(',') : undefined
    );

    return configWithAndroidManifest;
  });
}

const withTikTokAppEvents = (config, props = {}) => {
  config = withAndroidJitPackRepository(config);
  config = withIosModularHeaders(config);
  config = withAndroidTikTokDefaults(config, props);
  config = withIosTikTokDefaults(config, props);
  return config;
};

module.exports = createRunOncePlugin(
  withTikTokAppEvents,
  pkg.name,
  pkg.version
);
