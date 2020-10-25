import Screen from './screen'
import { Keyboard, KeyRect } from './keyboard'
import Mouse from './mouse'
import { PointerXAxis, PointerYAxis, PointerAxisImageSet } from './pointer-axis'
import { Rect } from './gui'

function initPointerAxisHtml (
  srcPrefix: string,
  rects: PointerAxisImageSet<Rect>,
  fullWidth: number
) : string {
  const attrib = 'align="top" alt="Set cursor location" title="Cursor locator"'
  const parts: string[] = []
  const { sliced, top, bottom, left, right } = rects
  const scale = 99 / fullWidth
  parts.push('<table><tbody><tr><td>')
  parts.push(`<img src="${srcPrefix}/top.gif" width="${scale * top.width}%" ${attrib}>`)
  for (const [i, rect] of sliced.entries()) {
    const prevY = i - 1 >= 0 ? sliced[i - 1].y : null
    const nextY = i + 1 < sliced.length ? sliced[i + 1].y : null
    if (rect.y !== prevY) {
      parts.push('<br>')
      parts.push(`<img src="${srcPrefix}/left.gif" width="${scale * left.width}%" ${attrib}>`)
    }
    parts.push(`<a href="${srcPrefix}/${i}/move">`)
    parts.push(`<img src="${srcPrefix}/${i}/image.gif" width="${scale * rect.width}%" ${attrib}>`)
    parts.push('</a>')
    if (rect.y !== nextY) {
      parts.push(`<img src="${srcPrefix}/right.gif" width="${scale * right.width}%" ${attrib}>`)
    }
  }
  parts.push('<br>')
  parts.push(`<img src="${srcPrefix}/bottom.gif" width="${scale * bottom.width}%" ${attrib}>`)
  parts.push('</td></tr></tbody></table>')
  return parts.join('')
}

function initMouse () : string {
  const parts: string[] = []
  const { full, left, right, bottom } = Mouse.rects
  const scale = 99 / full.width
  parts.push('<a href="/pointer/mouse/left-click" title="Toggle left click">')
  parts.push(`<img src="/pointer/mouse/left-button.gif" width="${scale * left.width}%" align="top">`)
  parts.push('</a>')
  parts.push('<a href="/pointer/mouse/right-click" title="Toggle right click">')
  parts.push(`<img src="/pointer/mouse/right-button.gif" width="${scale * right.width}%" align="top">`)
  parts.push('</a>')
  parts.push('<br>')
  parts.push(`<img src="/pointer/mouse/mouse-grabby-part.gif" width="${scale * bottom.width}%" align="top">`)
  return parts.join('')
}

function initKeyboard () : string {
  const parts: string[] = []
  const scale = 99 / Keyboard.rect.width
  for (const row of [1, 2, 3, 4, 5].map(i => `row${i}`)) {
    const rowRect = Keyboard.rects[row] as KeyRect[]
    for (const [i, keyRect] of rowRect.entries()) {
      parts.push(`<a href="/keyboard/${row}/${i}/click" title="Toggle keyboard key '${keyRect.key}'">`)
      parts.push(`<img src="/keyboard/${row}/${i}/image.gif" width="${scale * keyRect.width}%" align="top">`)
    }
    parts.push('<br>')
  }
  return parts.join('')
}

function initHtml () : string {
  const htmlParts: string[] = []
  const screenAttrib = 'align="top" alt="OpenTTD got disconnected. Please refresh the page." title="Click the horizontal and vertical bars on above and on the left of the screen to move the cursor"'
  htmlParts.push('<html><body><table><tbody>')
  htmlParts.push('<tr><td><table><tbody>')
  htmlParts.push('<tr><td></td><td>')
  htmlParts.push(initPointerAxisHtml('/pointer/x', PointerXAxis.rects, Screen.width))
  htmlParts.push('</td></tr>')
  htmlParts.push('<tr>')
  htmlParts.push('<td>')
  htmlParts.push(initPointerAxisHtml('/pointer/y', PointerYAxis.rects, PointerYAxis.width))
  htmlParts.push('</td>')
  htmlParts.push(`<td><img src="/screen/stream.gif" width="99%" ${screenAttrib}></td>`)
  htmlParts.push('</tr>')
  htmlParts.push('</tbody></table></td></tr>')
  htmlParts.push('<tr><td><table><tbody>')
  htmlParts.push('<tr>')
  htmlParts.push('<td>')
  htmlParts.push(initKeyboard())
  htmlParts.push('</td>')
  htmlParts.push('<td>')
  htmlParts.push(initMouse())
  htmlParts.push('</td>')
  htmlParts.push('</tr>')
  htmlParts.push('</tbody></table></td></tr>')
  htmlParts.push('</tbody></table></body></html>')
  return htmlParts.join('')
}

const html = initHtml()
export default html
