import { showUI } from '@create-figma-plugin/utilities'

import { registerHandlers } from './sandbox/registerHandlers'

export default function () {
  registerHandlers()

  showUI({
    height: 280,
    width: 360
  })
}
