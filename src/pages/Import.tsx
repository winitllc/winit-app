import { useEffect, useRef, useState } from 'react'
import {
  getImportJobs, triggerImport, getCategories,
  createCsvImportJob, processCsvChunk, finishCsvImportJob, failCsvImportJob,
  splitIntoChunks,
  type AppCategory, type ImportJob, type CsvImportResult,
} from '../lib/supabase'
import styles from './Import.module.css'

type Tab = 'csv' | 'api'

export default function Import() {
  const [tab, setTab] = useState<Tab>('csv')
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)

  const loadJobs = () => {
    setLoadingJobs(true)
    getImportJobs().then(setJobs).finally(() => setLoadingJobs(false))
  }

  useEffect(() => { loadJobs() }, [])

  return (
    <div>
      <h1 className={styles.title}>Import Products</h1>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'csv' ? styles.tabActive : ''}`} onClick={() => setTab('csv')}>
          Upload CSV
        </button>
        <button className={`${styles.tab} ${tab === 'api' ? styles.tabActive : ''}`} onClick={() => setTab('api')}>
          API Pull
        </button>
      </div>

      <div className={styles.layout}>
        <div className={styles.formCard}>
          {tab === 'csv'
            ? <CsvUploadPanel onDone={loadJobs} />
            : <ApiPullPanel onDone={loadJobs} />}
        </div>

        <div className={styles.jobsCard}>
          <div className={styles.jobsHeader}>
            <h2 className={styles.cardTitle}>Import History</h2>
            <button className={styles.refreshBtn} onClick={loadJobs} title="Refresh">↺</button>
          </div>
          <JobsTable jobs={jobs} loading={loadingJobs} />
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

// ─── CSV Upload Panel ──────────────────────────────────────────────────────────

type UploadPhase = 'idle' | 'reading' | 'uploading' | 'done' | 'error'

interface UploadState {
  phase: UploadPhase
  filename: string
  totalLines: number
  totalChunks: number
  currentChunk: number
  processed: number
  skipped: number
  autoMapped: number
  needsReview: number
  error: string
  result: CsvImportResult | null
}

const initialUpload: UploadState = {
  phase: 'idle', filename: '', totalLines: 0, totalChunks: 0,
  currentChunk: 0, processed: 0, skipped: 0, autoMapped: 0, needsReview: 0,
  error: '', result: null,
}

function CsvUploadPanel({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState<UploadState>(initialUpload)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef(false)

  const reset = () => { setState(initialUpload); abortRef.current = false }

  const handleFile = async (file: File) => {
    if (!file) return
    abortRef.current = false
    setState({ ...initialUpload, phase: 'reading', filename: file.name })

    let text: string
    try {
      text = await file.text()
    } catch (e) {
      setState(s => ({ ...s, phase: 'error', error: 'Failed to read file: ' + String(e) }))
      return
    }

    const lines = text.split('\n')
    // Separate header from data
    const headerLine = lines[0] ?? ''
    if (!headerLine.trim()) {
      setState(s => ({ ...s, phase: 'error', error: 'File appears empty or has no header row.' }))
      return
    }

    const CHUNK_LINES = 2000
    const dataLines = lines.slice(1)
    const chunks: string[] = []
    for (let i = 0; i < dataLines.length; i += CHUNK_LINES) {
      const chunk = dataLines.slice(i, i + CHUNK_LINES).join('\n')
      if (chunk.trim()) chunks.push(chunk)
    }

    const totalLines = dataLines.filter(l => l.trim()).length
    setState(s => ({ ...s, phase: 'uploading', totalLines, totalChunks: chunks.length }))

    let jobId = ''
    try {
      jobId = await createCsvImportJob(file.name)
    } catch (e) {
      setState(s => ({ ...s, phase: 'error', error: 'Failed to create import job: ' + String(e) }))
      return
    }

    let processed = 0, skipped = 0, autoMapped = 0, needsReview = 0

    for (let i = 0; i < chunks.length; i++) {
      if (abortRef.current) {
        await failCsvImportJob(jobId, 'Cancelled by user')
        setState(s => ({ ...s, phase: 'error', error: 'Import cancelled.' }))
        return
      }
      try {
        const res = await processCsvChunk(jobId, headerLine, chunks[i])
        processed += res.processed
        skipped += res.skipped
        autoMapped += res.auto_mapped
        needsReview += res.needs_review
        setState(s => ({
          ...s,
          currentChunk: i + 1,
          processed,
          skipped,
          autoMapped,
          needsReview,
        }))
      } catch (e) {
        await failCsvImportJob(jobId, String(e))
        setState(s => ({ ...s, phase: 'error', error: 'Chunk upload failed: ' + String(e) }))
        return
      }
    }

    try {
      const result = await finishCsvImportJob(jobId)
      setState(s => ({ ...s, phase: 'done', result }))
      onDone()
    } catch (e) {
      setState(s => ({ ...s, phase: 'error', error: 'Failed to finalize import: ' + String(e) }))
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const pct = state.totalChunks > 0
    ? Math.round((state.currentChunk / state.totalChunks) * 100)
    : 0

  return (
    <>
      <h2 className={styles.cardTitle}>Upload Full OFF CSV</h2>
      <p className={styles.cardDesc}>
        Upload the Open Food Facts CSV export directly. Products are auto-categorized
        using the OFF categories_tags column — no category selection needed.
        The full dataset (~3 million products) is supported.
      </p>

      {state.phase === 'idle' && (
        <div
          className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
        >
          <div className={styles.dropzoneIcon}>⬆</div>
          <div className={styles.dropzoneText}>Drop OFF CSV file here, or click to browse</div>
          <div className={styles.dropzoneHint}>
            Tab-separated (.csv / .tsv) · Any size · Header row required
          </div>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className={styles.hiddenInput}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {state.phase === 'reading' && (
        <div className={styles.progressBox}>
          <div className={styles.progressLabel}>Reading {state.filename}…</div>
          <div className={styles.spinnerInline} />
        </div>
      )}

      {state.phase === 'uploading' && (
        <div className={styles.progressBox}>
          <div className={styles.progressHeader}>
            <span className={styles.progressFilename}>{state.filename}</span>
            <span className={styles.progressPct}>{pct}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.progressStats}>
            <Stat label="Chunks" value={`${state.currentChunk} / ${state.totalChunks}`} />
            <Stat label="Imported" value={state.processed.toLocaleString()} />
            <Stat label="Skipped" value={state.skipped.toLocaleString()} />
            <Stat label="Auto-mapped" value={state.autoMapped.toLocaleString()} color="success" />
            <Stat label="Needs review" value={state.needsReview.toLocaleString()} color="warning" />
          </div>
          <button className={styles.cancelBtn} onClick={() => { abortRef.current = true }}>
            Cancel
          </button>
        </div>
      )}

      {state.phase === 'done' && state.result && (
        <div className={styles.doneBox}>
          <div className={styles.doneTitle}>Import complete</div>
          <div className={styles.doneStats}>
            <Stat label="Products imported" value={state.result.products_upserted.toLocaleString()} color="success" large />
            <Stat label="Skipped" value={state.result.products_skipped.toLocaleString()} />
            <Stat label="Auto-categorized" value={state.result.auto_mapped.toLocaleString()} color="success" />
            <Stat label="Needs review" value={state.result.needs_review.toLocaleString()} color="warning" />
          </div>
          <button className={styles.importBtn} onClick={reset}>Import Another File</button>
        </div>
      )}

      {state.phase === 'error' && (
        <div className={styles.errorBox}>
          <div className={styles.errorText}>{state.error}</div>
          <button className={styles.importBtn} onClick={reset}>Try Again</button>
        </div>
      )}
    </>
  )
}

function Stat({ label, value, color, large }: { label: string; value: string; color?: string; large?: boolean }) {
  return (
    <div className={`${styles.stat} ${color === 'success' ? styles.statSuccess : color === 'warning' ? styles.statWarning : ''} ${large ? styles.statLarge : ''}`}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

// ─── API Pull Panel ────────────────────────────────────────────────────────────

function ApiPullPanel({ onDone }: { onDone: () => void }) {
  const [categories, setCategories] = useState<AppCategory[]>([])
  const [selected, setSelected] = useState<AppCategory | null>(null)
  const [maxPages, setMaxPages] = useState(10)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ products_upserted: number; pages_imported: number; error: string | null } | null>(null)

  useEffect(() => {
    getCategories().then(cats => { setCategories(cats); if (cats.length) setSelected(cats[0]) })
  }, [])

  const runImport = async () => {
    if (!selected) return
    setImporting(true)
    setResult(null)
    try {
      const res = await triggerImport(selected.slug, selected.off_tag, maxPages)
      setResult(res)
      onDone()
    } catch (err) {
      setResult({ products_upserted: 0, pages_imported: 0, error: String(err) })
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <h2 className={styles.cardTitle}>Pull from OFF API</h2>
      <p className={styles.cardDesc}>
        Fetch products live from the OpenFoodFacts API by category.
        50 products per page. Re-running updates existing products.
        Auto-categorization applies on import.
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
        {importing ? <><span className={styles.btnSpinner} /> Importing…</> : <>↓ Start Import</>}
      </button>

      {result && (
        <div className={`${styles.result} ${result.error ? styles.resultError : styles.resultSuccess}`}>
          {result.error
            ? `Error: ${result.error}`
            : `Imported ${result.products_upserted} products over ${result.pages_imported} page(s).`}
        </div>
      )}
    </>
  )
}

// ─── Jobs Table ───────────────────────────────────────────────────────────────

function JobsTable({ jobs, loading }: { jobs: ImportJob[]; loading: boolean }) {
  if (loading) return <div className={styles.spinner} />
  if (!jobs.length) return <div className={styles.empty}>No imports yet.</div>

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Source</th>
          <th>File / Category</th>
          <th>Status</th>
          <th>Imported</th>
          <th>Auto-mapped</th>
          <th>Review</th>
          <th>Started</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map(j => (
          <tr key={j.id}>
            <td>
              <span className={`${styles.sourceBadge} ${j.source === 'csv' ? styles.sourceCsv : styles.sourceApi}`}>
                {j.source === 'csv' ? 'CSV' : 'API'}
              </span>
            </td>
            <td>
              <strong>{j.filename ?? j.category_slug}</strong>
              {j.source === 'api' && <div className={styles.offTag}>{j.off_tag}</div>}
            </td>
            <td><span className={`${styles.jobStatus} ${styles[j.status]}`}>{j.status}</span></td>
            <td>{j.products_upserted.toLocaleString()}</td>
            <td>{j.auto_mapped > 0 ? <span className={styles.mappedCount}>{j.auto_mapped.toLocaleString()}</span> : '—'}</td>
            <td>{j.needs_review > 0 ? <span className={styles.reviewCount}>{j.needs_review.toLocaleString()}</span> : '—'}</td>
            <td>{new Date(j.started_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
