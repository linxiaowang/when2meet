<template>
  <div
    class="app" :class="{
      dark: isDark,
    }"
  >
    <main
      p="x-3 y-4"
      font-sans
      color="gray-800 dark:gray-100"
    >
      <slot />
    </main>
  </div>
</template>
