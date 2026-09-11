import type { ConfigPlugin, ExportedConfig } from '@expo/config-plugins';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const withTikTokAppEvents: ConfigPlugin = require('../../app.plugin');

describe('Expo plugin iOS Podfile', () => {
  let projectRoot: string;
  let podfilePath: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(path.join(tmpdir(), 'tiktok-plugin-'));
    mkdirSync(path.join(projectRoot, 'ios'));
    podfilePath = path.join(projectRoot, 'ios', 'Podfile');
  });

  afterEach(() => {
    unlinkSync(podfilePath);
    rmdirSync(path.join(projectRoot, 'ios'));
    rmdirSync(projectRoot);
  });

  async function applyIosPodfileMod() {
    const config: ExportedConfig = withTikTokAppEvents({
      name: 'Example',
      slug: 'example',
    });
    const iosMod = config.mods?.ios?.dangerous;
    if (!iosMod) {
      throw new Error('The plugin must register an iOS Podfile mod.');
    }

    await iosMod({
      ...config,
      modResults: {},
      modRawConfig: config,
      modRequest: {
        projectRoot,
        platformProjectRoot: path.join(projectRoot, 'ios'),
        platform: 'ios',
        modName: 'dangerous',
        introspect: false,
      },
    });

    return readFileSync(podfilePath, 'utf8');
  }

  it.each(["'", '"'])(
    'scopes modular headers to TikTokBusinessSDK with %s target quotes',
    async (quote) => {
      const target = `target ${quote}Example${quote} do`;
      const original = `platform :ios, '15.1'

${target}
  use_expo_modules!
  pod 'OtherSDK'
end
`;
      writeFileSync(podfilePath, original);

      const updated = await applyIosPodfileMod();

      expect(updated).toBe(`platform :ios, '15.1'

${target}
  pod 'TikTokBusinessSDK', :modular_headers => true
  use_expo_modules!
  pod 'OtherSDK'
end
`);
      expect(updated).not.toContain('use_modular_headers!');
    }
  );

  it('keeps the Podfile unchanged on a second prebuild', async () => {
    writeFileSync(
      podfilePath,
      "target 'Example' do\n  use_expo_modules!\nend\n"
    );

    const first = await applyIosPodfileMod();
    const second = await applyIosPodfileMod();

    expect(first).toContain(
      "pod 'TikTokBusinessSDK', :modular_headers => true"
    );
    expect(second).toBe(first);
    expect(second.match(/pod 'TikTokBusinessSDK'/g)).toHaveLength(1);
  });

  it.each([
    ['root', "use_modular_headers!\n\ntarget 'Example' do\nend\n"],
    ['target', "target 'Example' do\n  use_modular_headers!\nend\n"],
  ])(
    'preserves a pre-existing global header setting at the %s',
    async (_location, original) => {
      writeFileSync(podfilePath, original);

      const updated = await applyIosPodfileMod();

      expect(updated).toContain(
        "pod 'TikTokBusinessSDK', :modular_headers => true"
      );
      expect(
        updated.replace(
          "  pod 'TikTokBusinessSDK', :modular_headers => true\n",
          ''
        )
      ).toBe(original);
    }
  );
});
