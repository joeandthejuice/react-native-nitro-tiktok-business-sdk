#pragma once

#include "HybridTikTokAppEventsSpec.hpp"

namespace margelo::nitro::tiktokappevents {

class HybridTikTokAppEvents final : public HybridTikTokAppEventsSpec {
public:
  HybridTikTokAppEvents() : HybridObject(TAG) {}

  std::shared_ptr<Promise<void>> initialize(
      const TikTokInitializeOptions& options) override;
  void startTracking() override;
  void identify(const TikTokIdentity& identity) override;
  void logout() override;
  void flush() override;
  void trackEvent(const TikTokEvent& event) override;
  void trackContentEvent(const TikTokContentEvent& event) override;
  std::shared_ptr<Promise<std::optional<std::string>>>
  fetchDeferredDeepLink() override;

private:
  static std::optional<std::string>
  normalizeString(const std::optional<std::string>& value);
  static std::optional<std::string>
  normalizeEmail(const std::optional<std::string>& value);
};

} // namespace margelo::nitro::tiktokappevents
