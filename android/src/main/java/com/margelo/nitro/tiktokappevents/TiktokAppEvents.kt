package com.margelo.nitro.tiktokappevents
  
import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class TiktokAppEvents : HybridTiktokAppEventsSpec() {
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }
}
