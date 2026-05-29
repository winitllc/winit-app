import { useEffect, useState } from 'react'
import { getCategories, getImportJobs, triggerImport, type AppCategory, type ImportJob } from '../lib/supabase'
import styles from './Import.module.css'

export default function Import() {
  const [categories, setCategories] = useState<AppCategory[]>([])
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [selected, setSelected] = useState<AppCategory | null>(null)
  const [maxPages, setMaxPages] = useState(10)
  const [importing, setImporting] = useState(false)
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [result, setResult] = useState<{ products_upserted: number; pages_imported: number; error: string | null } | null>(null)

  useEffect(() => {
    getCategories().then(cats => { setCategories(cats); if (cats.length) setSelected(cats[0]) })
    loadJobs()
  }, [])

  const loadJobs = () => {
    setLoadingJobs(true)
    getImportJobs().then(setJobs).finally(() => setLoadingJobs(false))
  }

  const runImport = async () => {
    if (!selected) return
    setImporting(true)
    setResult(null)
    try {
      const res = await triggerImport(selected.slug, selected.off_tag, maxPages)
      setResult(res)
      loadJobs()
    } catch (err) {
      setResult({ products_upserted: 0, pages_imported: 0, error: String(err) })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Import from OpenFoodFacts</h1>

      <div className={styles.layout}>
        <div className={styles.formCard}>
          <h2 className={styles.cardTitle}>Trigger Import</h2>
          <p className={styles.cardDesc}>
            Fetches products from OpenFoodFacts and saves them as "pending" for review.
            50 products per page. Re-running updates existing products.
          </p>

          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <select className={styles.select}
              value={selected?.slug ?? ''}
              onChange={e => setSelected(categories.find(c => c.slug === e.target.value) ?? null)}>
              {categories.map(cat => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.display_name} ({cat.off_tag})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Max pages ({maxPages * 50} products max)</label>
            <input className={styles.input} type="number" min="1" max="200"
              value={maxPages} onChange={e => setMaxPages(parseInt(e.target.value, 10) || 1)} />
          </div>

          <button className={styles.importBtn} onClick={runImport} disabled={importing || !selected}>
            {importing ? (
              <><span className={styles.btnSpinner} /> Importing…</>
            ) : (
              <>↓ Start Import</>
            )}
          </button>

          {result && (
            <div className={`${styles.result} ${result.error ? styles.resultError : styles.resultSuccess}`}>
              {result.error
                ? `Error: ${result.error}`
                : `Imported ${result.products_upserted} products over ${result.pages_imported} page(s).`}
            </div>
          )}
        </div>

        <div className={styles.jobsCard}>
          <div className={styles.jobsHeader}>
            <h2 className={styles.cardTitle}>Import History</h2>
            <button className={styles.refreshBtn} onClick={loadJobs} title="Refresh">↺</button>
          </div>

          {loadingJobs ? (
            <div className={styles.spinner} />
          ) : jobs.length === 0 ? (
            <div className={styles.empty}>No imports yet.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Products</th>
                  <th>Pages</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id}>
                    <td>
                      <strong>{j.category_slug}</strong>
                      <div className={styles.offTag}>{j.off_tag}</div>
                    </td>
                    <td><span className={`${styles.jobStatus} ${styles[j.status]}`}>{j.status}</span></td>
                    <td>{j.products_upserted}</td>
                    <td>{j.pages_imported}</td>
                    <td>{new Date(j.started_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={styles.attribution}>
        <strong>Attribution:</strong> Product data from{' '}
        <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a>{' '}
        under the <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">ODbL license</a>.
      </div>
    </div>
  )
}
