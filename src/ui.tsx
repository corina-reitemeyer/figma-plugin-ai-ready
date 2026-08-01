import { render } from '@create-figma-plugin/ui'
import { h } from 'preact'

import { App } from './ui/App'
import '!./ui/styles.css'

function Plugin() {
  return <App />
}

export default render(Plugin)
