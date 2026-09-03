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
  height: 100%;
  min-height: 100%;
  overflow: hidden;
}
.shell {
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 0;
  text-align: left;
  overflow: hidden;
}
</style>
