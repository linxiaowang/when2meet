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
  min-height: 100%;
  min-height: 100dvh;
}
.shell {
  box-sizing: border-box;
  padding: calc(16px + env(safe-area-inset-top, 0px)) 16px calc(32px + env(safe-area-inset-bottom, 0px));
  text-align: left;
}
</style>
