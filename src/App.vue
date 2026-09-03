<script setup lang="ts">
import { CLOUD_ENV_ID } from './cloud-env'

onLaunch(() => {
  // #ifdef MP-WEIXIN
  const g = globalThis as typeof globalThis & { wx?: { cloud?: { init: (o: object) => void } } }
  if (g.wx?.cloud)
    g.wx.cloud.init({ env: CLOUD_ENV_ID || undefined, traceUser: false })
  // #endif
})
</script>

<style lang="scss">
@import './styles/main.css';
</style>
