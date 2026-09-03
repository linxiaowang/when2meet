<template>
  <view
    class="app" :class="{
      dark: isDark,
    }"
  >
    <view
      class="shell"
      font-sans
      color="gray-700 dark:gray-200"
    >
      <slot />
    </view>
  </view>
</template>

<style scoped>
.app {
  min-height: 100%;
}
.shell {
  box-sizing: border-box;
  padding: 0;
  text-align: left;
}
</style>
