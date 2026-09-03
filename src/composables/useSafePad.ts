/**
 * WeChat custom nav: pad using the capsule button box.
 * Header height = getMenuButtonBoundingClientRect().bottom (status bar + capsule).
 */
export function useSafePad() {
  const statusBarHeight = ref(44)
  const navTop = ref(44)
  const navHeight = ref(32)
  const padTop = ref(88)
  const padRight = ref(96)
  const padBottom = ref(8)
  const windowHeight = ref(667)
  const windowWidth = ref(375)

  function read() {
    try {
      const sys = uni.getSystemInfoSync()
      windowHeight.value = sys.windowHeight || 667
      windowWidth.value = sys.windowWidth || 375
      const bar = sys.statusBarHeight || sys.safeAreaInsets?.top || 44
      statusBarHeight.value = bar
      padBottom.value = sys.safeAreaInsets?.bottom || 8

      let menu: ReturnType<typeof uni.getMenuButtonBoundingClientRect> | null = null
      try {
        menu = uni.getMenuButtonBoundingClientRect()
      }
      catch {
        menu = null
      }

      if (menu && menu.bottom > 0) {
        navTop.value = menu.top
        navHeight.value = menu.height > 0 ? menu.height : 32
        padTop.value = menu.bottom
        const rightGap = windowWidth.value - menu.left
        padRight.value = Math.max(12, rightGap + 8)
      }
      else {
        navTop.value = bar
        navHeight.value = 32
        padTop.value = bar + 48
        padRight.value = 96
      }
    }
    catch {
      padTop.value = 88
    }
  }

  read()
  onMounted(() => {
    read()
    nextTick(read)
  })

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
