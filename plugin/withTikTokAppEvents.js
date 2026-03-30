const {
  createRunOncePlugin,
  withDangerousMod,
  withInfoPlist,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

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

function withOptionalTrackingUsageDescription(config, props) {
  if (!props?.iosUserTrackingUsageDescription) {
    return config;
  }

  return withInfoPlist(config, (configWithInfoPlist) => {
    if (!configWithInfoPlist.modResults.NSUserTrackingUsageDescription) {
      configWithInfoPlist.modResults.NSUserTrackingUsageDescription =
        props.iosUserTrackingUsageDescription;
    }
    return configWithInfoPlist;
  });
}

const withTikTokAppEvents = (config, props = {}) => {
  config = withAndroidJitPackRepository(config);
  config = withIosModularHeaders(config);
  config = withOptionalTrackingUsageDescription(config, props);
  return config;
};

module.exports = createRunOncePlugin(
  withTikTokAppEvents,
  pkg.name,
  pkg.version
);
