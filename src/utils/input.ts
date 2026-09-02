/** uni-app / 原生 input 的取值，避免 IME 下 v-model 把字打双份 */
export function inputValue(e: unknown): string {
  if (!e || typeof e !== 'object')
    return ''
  const rec = e as { detail?: { value?: unknown }, target?: { value?: unknown } }
  if (typeof rec.detail?.value === 'string')
    return rec.detail.value
  if (typeof rec.target?.value === 'string')
    return rec.target.value
  return ''
}
