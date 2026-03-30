#include <jni.h>
#include "tiktokappeventsOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::tiktokappevents::initialize(vm);
}
