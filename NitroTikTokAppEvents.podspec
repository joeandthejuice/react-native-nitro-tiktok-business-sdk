require "json"
require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NitroTikTokAppEvents"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["name"]
  s.source       = { :git => package["repository"]["url"], :tag => "#{s.version}" }

  s.platforms    = { :ios => min_ios_version_supported }

  s.source_files = [
    "ios/**/*.{h,m,mm}",
    "cpp/**/*.{h,hpp,c,cpp,mm}"
  ]

  s.user_target_xcconfig = {
    "OTHER_LDFLAGS" => "$(inherited) -ObjC -lc++"
  }

  s.dependency "TikTokBusinessSDK", "1.6.0"
  s.dependency "React-jsi"
  s.dependency "React-callinvoker"

  load "nitrogen/generated/ios/NitroTikTokAppEvents+autolinking.rb"
  add_nitrogen_files(s)

  install_modules_dependencies(s)
end
