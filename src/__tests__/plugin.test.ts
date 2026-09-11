import { IOSConfig } from 'expo/config-plugins';
import type { ConfigPlugin, ExportedConfig } from 'expo/config-plugins';

const withTikTokAppEvents: ConfigPlugin = require('../../app.plugin');

const tikTokPod = { name: 'TikTokBusinessSDK', modular_headers: true };

function createConfig(): ExportedConfig {
  return { name: 'Example', slug: 'example' };
}

async function applyIosPropertiesMod(
  config: ExportedConfig = withTikTokAppEvents(createConfig()),
  properties: Record<string, string> = {}
) {
  const iosMod = config.mods?.ios?.podfileProperties;
  if (!iosMod) {
    throw new Error('The plugin must register an iOS Podfile properties mod.');
  }

  const result = await iosMod({
    ...config,
    modResults: properties,
    modRawConfig: config,
    modRequest: {
      projectRoot: '/example',
      platformProjectRoot: '/example/ios',
      platform: 'ios',
      modName: 'podfileProperties',
      introspect: true,
    },
  });

  return result.modResults;
}

describe('Expo plugin iOS Podfile properties', () => {
  it('adds only TikTok modular headers and preserves other properties', async () => {
    const result = await applyIosPropertiesMod(undefined, {
      'ios.useFrameworks': 'static',
    });

    expect(result).toEqual({
      'ios.useFrameworks': 'static',
      'apple.extraPods': JSON.stringify([tikTokPod]),
    });
  });

  it('preserves other pods and existing TikTok options', async () => {
    const otherPod = { name: 'OtherSDK', modular_headers: false };
    const existingTikTokPod = {
      name: 'TikTokBusinessSDK',
      version: '1.5.0',
      source: 'https://cdn.cocoapods.org/',
      configurations: ['Release'],
      modular_headers: false,
    };
    const result = await applyIosPropertiesMod(undefined, {
      'apple.extraPods': JSON.stringify([otherPod, existingTikTokPod]),
    });

    expect(JSON.parse(result['apple.extraPods']!)).toEqual([
      otherPod,
      { ...existingTikTokPod, modular_headers: true },
    ]);
  });

  it('does not add another TikTok pod on a second prebuild', async () => {
    const first = await applyIosPropertiesMod();
    const second = await applyIosPropertiesMod(undefined, { ...first });

    expect(second).toEqual(first);
    expect(JSON.parse(second['apple.extraPods']!)).toEqual([tikTokPod]);
  });

  it.each(['before', 'after'])(
    'preserves build properties when registered %s its static mod',
    async (order) => {
      const extraPods = [
        { name: 'OtherSDK' },
        { name: 'TikTokBusinessSDK', version: '1.5.0' },
      ];
      const withBuildProperties =
        IOSConfig.BuildProperties.createBuildPodfilePropsConfigPlugin([
          {
            propName: 'apple.extraPods',
            propValueGetter: () => JSON.stringify(extraPods),
          },
        ]);
      let config = createConfig();
      if (order === 'before') {
        config = withBuildProperties(withTikTokAppEvents(config));
      } else {
        config = withTikTokAppEvents(withBuildProperties(config));
      }

      const result = await applyIosPropertiesMod(config);

      expect(JSON.parse(result['apple.extraPods']!)).toEqual([
        extraPods[0],
        { ...extraPods[1], modular_headers: true },
      ]);
    }
  );

  it('fails on invalid extraPods JSON', async () => {
    await expect(
      applyIosPropertiesMod(undefined, { 'apple.extraPods': '[' })
    ).rejects.toThrow(SyntaxError);
  });

  it('registers a static iOS mod without an iOS dangerous mod', () => {
    const config: ExportedConfig = withTikTokAppEvents(createConfig());

    expect(config.mods?.ios?.dangerous).toBeUndefined();
    expect(config.mods?.ios?.podfileProperties?.isIntrospective).toBe(true);
  });
});
