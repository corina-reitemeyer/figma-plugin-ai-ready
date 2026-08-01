import { Fragment, h } from 'preact'

import { AuditReport } from '../../shared/types'
import { SafeText } from '../SafeText'

type FileContextViewProps = {
  report: AuditReport
}

export function FileContextView({ report }: FileContextViewProps) {
  return (
    <div className="file-context">
      <h3 className="section-title">Scan metadata</h3>
      <dl className="meta-list">
        <div>
          <dt>Scope</dt>
          <dd>{report.scope}</dd>
        </div>
        <div>
          <dt>Scanned at</dt>
          <dd>{new Date(report.scannedAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{report.durationMs} ms</dd>
        </div>
        <div>
          <dt>Rule set</dt>
          <dd>{report.rulesetVersion}</dd>
        </div>
      </dl>

      <h3 className="section-title">Inventory</h3>
      <ul className="inventory-counts">
        <li>{report.inventory.componentCount} components</li>
        <li>{report.inventory.componentSetCount} component sets</li>
        <li>{report.inventory.frameCount} frames</li>
        <li>{report.inventory.pageCount} pages</li>
      </ul>

      {report.inventory.pages.length > 0 ? (
        <Fragment>
          <h3 className="section-title">Pages</h3>
          <table className="page-table">
            <caption className="sr-only">Components by page</caption>
            <thead>
              <tr>
                <th scope="col">Page</th>
                <th scope="col">Components</th>
                <th scope="col">Sets</th>
              </tr>
            </thead>
            <tbody>
              {report.inventory.pages.map(function (page) {
                return (
                  <tr key={page.pageId}>
                    <td>
                      <SafeText value={page.pageName} />
                    </td>
                    <td>{page.componentCount}</td>
                    <td>{page.componentSetCount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Fragment>
      ) : null}

      <p className="muted">
        Code Connect coverage is not checked in v1 (deferred until mapping data
        can be imported offline).
      </p>
    </div>
  )
}
