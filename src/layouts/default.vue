<template>
  <div
    class="app" :class="{
      dark: isDark,
    }"
  >
    <main
      class="shell"
      font-sans
      color="gray-700 dark:gray-200"
    >
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app {
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
}
.shell {
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 8px calc(8px + env(safe-area-inset-bottom, 0px));
  text-align: left;
  overflow: hidden;
}
</style>
