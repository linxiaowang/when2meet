/**
 * WeChat custom nav: pad around statusBar + capsule (menu button).
 * H5 falls back to a modest top inset when there is no menu button.
 */
export function useSafePad() {
  const statusBarHeight = ref(20)
  const navTop = ref(20)
  const navHeight = ref(32)
  const padTop = ref(56)
  const padRight = ref(12)
  const padBottom = ref(8)
  const windowHeight = ref(667)
  const windowWidth = ref(375)

  function read() {
    try {
      const sys = uni.getSystemInfoSync()
      windowHeight.value = sys.windowHeight || 667
      windowWidth.value = sys.windowWidth || 375
      statusBarHeight.value = sys.statusBarHeight || 0
      padBottom.value = sys.safeAreaInsets?.bottom || 8

      let menu: ReturnType<typeof uni.getMenuButtonBoundingClientRect> | null = null
      try {
        menu = uni.getMenuButtonBoundingClientRect()
      }
      catch {
        menu = null
      }

      if (menu && menu.width > 0 && menu.bottom > 0) {
        navTop.value = menu.top
        navHeight.value = menu.height
        padTop.value = menu.bottom + 10
        padRight.value = Math.max(12, windowWidth.value - menu.left + 8)
      }
      else {
        const bar = statusBarHeight.value || 0
        navTop.value = bar
        navHeight.value = 44
        padTop.value = bar + 12
        padRight.value = 12
      }
    }
    catch {
      padTop.value = 56
    }
  }

  read()
  onMounted(read)

  return {
    statusBarHeight,
    navTop,
    navHeight,
    padTop,
    padRight,
    padBottom,
    windowHeight,
    windowWidth,
    read,
  }
}
