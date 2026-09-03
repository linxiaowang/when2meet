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
.shell {
  padding: 16px 16px 32px;
  text-align: left;
}
</style>
