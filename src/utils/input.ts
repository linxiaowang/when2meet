/** uni-app / 原生 input 的取值，避免 IME 下 v-model 把字打双份 */
export function inputValue(e: unknown): string {
  if (!e || typeof e !== 'object')
    return ''
  const rec = e as { detail?: { value?: unknown }, target?: { value?: unknown } }
  // H5 原生 input 的 target.value 已是最终字符串，优先用它避免 IME 打双字
  if (typeof rec.target?.value === 'string')
    return rec.target.value
  if (typeof rec.detail?.value === 'string')
    return rec.detail.value
  return ''
}
