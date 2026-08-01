import { once, showUI } from '@create-figma-plugin/utilities'

import { CloseHandler } from './types'

export default function () {
  once<CloseHandler>('CLOSE', function () {
    figma.closePlugin()
  })

  showUI({
    height: 280,
    width: 360
  })
}
