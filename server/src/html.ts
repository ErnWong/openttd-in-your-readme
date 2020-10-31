import { Keyboard, KeyRect } from './keyboard'
import Mouse from './mouse'
import { PointerXAxis, PointerYAxis } from './pointer-axis'

const host = ''

function initPointerXAxisHtml () : string {
  const srcPrefix = `${host}/pointer/x`
  const attrib = 'align="top" alt="Set cursor location" title="Cursor locator"'
  const parts: string[] = []
  const clickSlices = PointerXAxis.clickSlices
  parts.push('<table><tbody><tr><td>')
  parts.push(`<img src="${srcPrefix}/cursor.gif" ${attrib}>`)
  parts.push('<br>')
  for (const [i, rect] of clickSlices.entries()) {
    parts.push(`<a href="${srcPrefix}/${i}/move">`)
    parts.push(`<img src="${srcPrefix}/${rect.imageSource}.gif" ${attrib}>`)
    parts.push('</a>')
  }
  parts.push('</td></tr></tbody></table>')
  return parts.join('')
}

function initPointerYAxisHtml () : string {
  const srcPrefix = `${host}/pointer/y`
  const attrib = 'align="top" alt="Set cursor location" title="Cursor locator"'
  const parts: string[] = []
  const clickSlices = PointerYAxis.clickSlices
  parts.push('<table><tbody><tr><td>')
  parts.push(`<img src="${srcPrefix}/cursor.gif" ${attrib}>`)
  parts.push('</td><td><table><tbody><tr><td>')
  for (const [i, rect] of clickSlices.entries()) {
    const prevY = i - 1 >= 0 ? clickSlices[i - 1].y : null
    if (rect.y !== prevY) {
      parts.push('<br>')
    }
    parts.push(`<a href="${srcPrefix}/${rect.pointerPosition}/move">`)
    parts.push(`<img src="${srcPrefix}/${rect.imageSource}.gif" ${attrib}>`)
    parts.push('</a>')
  }
  parts.push('</td></tr></tbody></table></td></tr></tbody></table>')
  return parts.join('')
}

function initMouse () : string {
  const parts: string[] = []
  const { full, left, right, bottom } = Mouse.rects
  const scale = 99 / full.width
  parts.push(`<a href="${host}/pointer/mouse/left-click" title="Toggle left click">`)
  parts.push(`<img src="${host}/pointer/mouse/left-button.gif" width="${scale * left.width}%" align="top">`)
  parts.push('</a>')
  parts.push(`<a href="${host}/pointer/mouse/right-click" title="Toggle right click">`)
  parts.push(`<img src="${host}/pointer/mouse/right-button.gif" width="${scale * right.width}%" align="top">`)
  parts.push('</a>')
  parts.push('<br>')
  parts.push(`<img src="${host}/pointer/mouse/mouse-grabby-part.gif" width="${scale * bottom.width}%" align="top">`)
  return parts.join('')
}

function initKeyboard () : string {
  const parts: string[] = []
  for (const row of [1, 2, 3, 4, 5].map(i => `row${i}`)) {
    const rowRect = Keyboard.rects[row] as KeyRect[]
    for (const [i, keyRect] of rowRect.entries()) {
      parts.push(`<a href="${host}/keyboard/${row}/${i}/click" title="Toggle keyboard key '${keyRect.key}'">`)
      parts.push(`<img src="${host}/keyboard/${row}/${i}/image.gif" align="top">`)
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
  htmlParts.push(initPointerXAxisHtml())
  htmlParts.push('</td></tr>')
  htmlParts.push('<tr>')
  htmlParts.push('<td>')
  htmlParts.push(initPointerYAxisHtml())
  htmlParts.push('</td>')
  htmlParts.push(`<td><img src="${host}/screen/snapshot.gif" ${screenAttrib}></td>`)
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
