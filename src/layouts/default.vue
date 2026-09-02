<template>
  <view
    class="app" :class="{
      dark: isDark,
    }"
  >
    <view class="min-h-screen px-4 py-5 text-gray-800 font-sans">
      <slot />
    </view>
  </view>
</template>
