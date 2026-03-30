package com.margelo.nitro.tiktokappevents

import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.AnyMap
import com.margelo.nitro.core.Promise
import com.tiktok.TikTokBusinessSdk
import com.tiktok.appevents.ErrorData
import com.tiktok.appevents.base.TTBaseEvent
import com.tiktok.appevents.contents.TTAddToCartEvent
import com.tiktok.appevents.contents.TTAddToWishlistEvent
import com.tiktok.appevents.contents.TTCheckoutEvent
import com.tiktok.appevents.contents.TTContentParams
import com.tiktok.appevents.contents.TTContentsEvent
import com.tiktok.appevents.contents.TTContentsEventConstants
import com.tiktok.appevents.contents.TTPurchaseEvent
import com.tiktok.appevents.contents.TTViewContentEvent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

@Keep
@DoNotStrip
class HybridTikTokAppEvents : HybridTikTokAppEventsSpec() {
  companion object {
    private const val appIdMetaDataKey =
      "com.joeandthejuice.react_native_nitro_tiktok_business_sdk.APP_ID"
    private const val tikTokAppIdsMetaDataKey =
      "com.joeandthejuice.react_native_nitro_tiktok_business_sdk.TIKTOK_APP_IDS"
  }

  private val mainHandler = Handler(Looper.getMainLooper())

  override fun initialize(options: TikTokInitializeOptions): Promise<Unit> {
    if (TikTokBusinessSdk.isInitialized()) {
      return Promise.resolved(Unit)
    }

    return Promise.async {
      withContext(Dispatchers.Main.immediate) {
        suspendCoroutine<Unit> { continuation ->
          val context = NitroModules.applicationContext
            ?: run {
              continuation.resumeWithException(
                IllegalStateException("TikTok SDK initialization requires an Android application context.")
              )
              return@suspendCoroutine
            }

          val accessToken = options.accessToken.normalized()
          if (accessToken == null) {
            continuation.resumeWithException(
              IllegalArgumentException("TikTok initialization requires a non-empty accessToken.")
            )
            return@suspendCoroutine
          }

          val resolvedAppId = resolveAppId(context, options.appId)
          val resolvedTikTokAppIds = resolveTikTokAppIds(context, options.tikTokAppIds)

          if (resolvedTikTokAppIds.isEmpty()) {
            continuation.resumeWithException(
              IllegalArgumentException(
                "TikTok initialization requires at least one TikTok App ID, either from runtime options or Android manifest defaults configured by the Expo plugin."
              )
            )
            return@suspendCoroutine
          }

          val config = TikTokBusinessSdk.TTConfig(context, accessToken)
            .setAppId(resolvedAppId)
            .setTTAppId(resolvedTikTokAppIds.joinToString(","))

          if (options.trackingEnabled == false) {
            config.disableAutoStart()
          }
          if (options.automaticTrackingEnabled == false) {
            config.disableAutoEvents()
          }
          if (options.installTrackingEnabled == false) {
            config.disableInstallLogging()
          }
          if (options.launchTrackingEnabled == false) {
            config.disableLaunchLogging()
          }
          if (options.retentionTrackingEnabled == false) {
            config.disableRetentionLogging()
          }
          if (options.purchaseTrackingEnabled == false) {
            config.disableAutoIapTrack()
          } else if (options.purchaseTrackingEnabled == true) {
            config.enableAutoIapTrack()
          }
          if (options.enhancedDataPostbackEnabled == false) {
            config.disableAutoEnhancedDataPostbackEvent()
          }
          if (options.lowPerformanceDevice == true) {
            config.setIsLowPerformanceDevice(true)
          }
          if (options.advertiserIdCollectionEnabled == false) {
            config.disableAdvertiserIDCollection()
          }
          if (options.debugModeEnabled == true) {
            config.openDebugMode()
          }
          if (options.limitedDataUseEnabled == true) {
            config.enableLimitedDataUse()
          }

          when (options.logLevel?.trim()?.lowercase()) {
            "debug", "verbose" -> config.setLogLevel(TikTokBusinessSdk.LogLevel.DEBUG)
            "warn" -> config.setLogLevel(TikTokBusinessSdk.LogLevel.WARN)
            "info" -> config.setLogLevel(TikTokBusinessSdk.LogLevel.INFO)
            else -> config.setLogLevel(TikTokBusinessSdk.LogLevel.NONE)
          }

          TikTokBusinessSdk.initializeSdk(
            config,
            object : TikTokBusinessSdk.TTInitCallback {
              override fun success() {
                continuation.resume(Unit)
              }

              override fun fail(code: Int, msg: String) {
                continuation.resumeWithException(
                  IllegalStateException("TikTok SDK init failed ($code): $msg")
                )
              }
            }
          )
        }
      }
    }
  }

  override fun startTracking() {
    mainHandler.post {
      TikTokBusinessSdk.startTrack()
    }
  }

  override fun identify(identity: TikTokIdentity) {
    mainHandler.post {
      TikTokBusinessSdk.identify(
        identity.externalId.normalized(),
        identity.externalUserName.normalized(),
        identity.phoneNumber.normalized(),
        identity.email.normalizedEmail()
      )
    }
  }

  override fun logout() {
    mainHandler.post {
      TikTokBusinessSdk.logout()
    }
  }

  override fun flush() {
    mainHandler.post {
      TikTokBusinessSdk.flush()
    }
  }

  override fun trackEvent(event: TikTokEvent) {
    val eventName = event.name.trim()
    require(eventName.isNotEmpty()) { "TikTok event name cannot be empty." }

    val nativeEvent = TTBaseEvent(
      eventName,
      anyMapToJsonObject(event.properties),
      event.eventId.normalized()
    )

    mainHandler.post {
      TikTokBusinessSdk.trackTTEvent(nativeEvent)
    }
  }

  override fun trackContentEvent(event: TikTokContentEvent) {
    val eventName = event.name.trim()
    require(eventName.isNotEmpty()) { "TikTok content event name cannot be empty." }

    val nativeEvent = buildContentEvent(eventName, event.properties, event.eventId.normalized())

    mainHandler.post {
      TikTokBusinessSdk.trackTTEvent(nativeEvent)
    }
  }

  override fun fetchDeferredDeepLink(): Promise<String?> {
    return Promise.async {
      withContext(Dispatchers.Main.immediate) {
        suspendCoroutine<String?> { continuation ->
          TikTokBusinessSdk.fetchDeferredDeeplinkWithCompletion(
            object : TikTokBusinessSdk.FetchDeferredDeeplinkCompletion {
              override fun completion(deepLinkUrl: String?, errorData: ErrorData?) {
                if (!deepLinkUrl.isNullOrBlank()) {
                  continuation.resume(deepLinkUrl)
                  return
                }

                val code = errorData?.getCode()
                val message = errorData?.getMsg()
                if (code != null || !message.isNullOrBlank()) {
                  continuation.resumeWithException(
                    IllegalStateException(
                      "Failed to fetch TikTok deferred deep link (${code ?: "unknown"}): ${message ?: "Unknown error"}"
                    )
                  )
                  return
                }

                continuation.resume(null)
              }
            }
          )
        }
      }
    }
  }

  private fun anyMapToJsonObject(anyMap: AnyMap?): JSONObject {
    val jsonObject = JSONObject()
    if (anyMap == null) {
      return jsonObject
    }

    anyMap.toHashMap().forEach { (key, value) ->
      jsonObject.put(key, toJsonValue(value))
    }
    return jsonObject
  }

  private fun toJsonValue(value: Any?): Any {
    return when (value) {
      null -> JSONObject.NULL
      is JSONObject -> value
      is JSONArray -> value
      is String -> value
      is Boolean -> value
      is Int -> value
      is Long -> value
      is Double -> value
      is Float -> value.toDouble()
      is Short -> value.toInt()
      is Byte -> value.toInt()
      is Map<*, *> -> {
        val nested = JSONObject()
        value.forEach { (key, nestedValue) ->
          require(key is String) { "JSONObject keys must be strings." }
          nested.put(key, toJsonValue(nestedValue))
        }
        nested
      }
      is List<*> -> {
        val array = JSONArray()
        value.forEach { nestedValue ->
          array.put(toJsonValue(nestedValue))
        }
        array
      }
      is Array<*> -> {
        val array = JSONArray()
        value.forEach { nestedValue ->
          array.put(toJsonValue(nestedValue))
        }
        array
      }
      else -> throw IllegalArgumentException("Unsupported TikTok event property value: $value")
    }
  }

  private fun String?.normalized(): String? {
    val trimmed = this?.trim()
    return if (trimmed.isNullOrEmpty()) null else trimmed
  }

  private fun String?.normalizedEmail(): String? {
    return this.normalized()?.lowercase()
  }

  private fun buildContentEvent(
    eventName: String,
    properties: TikTokContentEventProperties?,
    eventId: String?
  ): TTBaseEvent {
    val builder = contentEventBuilderForName(eventName, eventId)

    properties?.contentType.normalized()?.let(builder::setContentType)
    properties?.contentId.normalized()?.let(builder::setContentId)
    properties?.description.normalized()?.let(builder::setDescription)
    properties?.currency.normalizedCurrency()?.let(builder::setCurrency)
    properties?.value?.let(builder::setValue)
    properties?.orderId.normalized()?.let { orderId ->
      builder.addProperty(
        TTContentsEventConstants.Params.EVENT_PROPERTY_ORDER_ID,
        orderId
      )
    }

    val contents = properties?.contents
      ?.map(::buildContentParams)
      ?.toTypedArray()
      .orEmpty()
    if (contents.isNotEmpty()) {
      builder.setContents(*contents)
    }

    return builder.build()
  }

  private fun contentEventBuilderForName(
    eventName: String,
    eventId: String?
  ): TTContentsEvent.Builder {
    return when (eventName) {
      TTContentsEventConstants.ContentsEventName.EVENT_NAME_ADD_TO_CARD ->
        TTAddToCartEvent.newBuilder(eventId)
      TTContentsEventConstants.ContentsEventName.EVENT_NAME_ADD_TO_WISHLIST ->
        TTAddToWishlistEvent.newBuilder(eventId)
      TTContentsEventConstants.ContentsEventName.EVENT_NAME_CHECK_OUT ->
        TTCheckoutEvent.newBuilder(eventId)
      TTContentsEventConstants.ContentsEventName.EVENT_NAME_PURCHASE ->
        TTPurchaseEvent.newBuilder(eventId)
      TTContentsEventConstants.ContentsEventName.EVENT_NAME_VIEW_CONTENT ->
        TTViewContentEvent.newBuilder(eventId)
      else -> throw IllegalArgumentException(
        "Unsupported TikTok content event name: $eventName"
      )
    }
  }

  private fun buildContentParams(content: TikTokContent): TTContentParams {
    val builder = TTContentParams.newBuilder()

    content.contentId.normalized()?.let(builder::setContentId)
    content.contentCategory.normalized()?.let(builder::setContentCategory)
    content.contentName.normalized()?.let(builder::setContentName)
    content.brand.normalized()?.let(builder::setBrand)
    content.price?.let { price ->
      builder.setPrice(price.toFloat())
    }
    content.quantity?.let { quantity ->
      require(quantity % 1.0 == 0.0) {
        "TikTok content quantity must be an integer."
      }
      builder.setQuantity(quantity.toInt())
    }

    return builder.build()
  }

  private fun String?.normalizedCurrency(): TTContentsEventConstants.Currency? {
    val normalized = this.normalized()?.uppercase() ?: return null

    return try {
      enumValueOf<TTContentsEventConstants.Currency>(normalized)
    } catch (_: IllegalArgumentException) {
      throw IllegalArgumentException(
        "Unsupported TikTok content event currency code: $normalized"
      )
    }
  }

  private fun resolveAppId(
    context: android.content.Context,
    runtimeAppId: String?
  ): String {
    return runtimeAppId.normalized()
      ?: readManifestMetaData(context, appIdMetaDataKey)
      ?: context.packageName
  }

  private fun resolveTikTokAppIds(
    context: android.content.Context,
    runtimeTikTokAppIds: Array<String>?
  ): List<String> {
    val runtimeIds = runtimeTikTokAppIds.orEmpty().mapNotNull { it.normalized() }
    if (runtimeIds.isNotEmpty()) {
      return runtimeIds
    }

    return readManifestMetaData(context, tikTokAppIdsMetaDataKey)
      ?.split(',')
      ?.mapNotNull { it.normalized() }
      .orEmpty()
  }

  private fun readManifestMetaData(
    context: android.content.Context,
    key: String
  ): String? {
    val applicationInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.packageManager.getApplicationInfo(
        context.packageName,
        PackageManager.ApplicationInfoFlags.of(PackageManager.GET_META_DATA.toLong())
      )
    } else {
      @Suppress("DEPRECATION")
      context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
    }

    return applicationInfo.metaData?.getString(key).normalized()
  }
}
