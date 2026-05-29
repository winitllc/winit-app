import { useEffect, useRef, useState } from 'react'
import {
  getImportJobs, triggerImport, getCategories, resetCategoryWatermark,
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
    const filename = file.name
    setState({ ...initialUpload, phase: 'reading', filename })

    // Stream the file line-by-line so we never load the whole thing into RAM.
    // This handles multi-GB OFF CSV files that would otherwise hit browser
    // memory limits and produce NotReadableError.
    const CHUNK_LINES = 2000

    let jobId = ''
    let headerLine = ''
    let pending: string[] = []   // lines buffered for current chunk
    let lineBuffer = ''          // partial line carried across decoder chunks
    let processed = 0, skipped = 0, autoMapped = 0, needsReview = 0
    let totalLines = 0, chunksSent = 0

    const flushChunk = async (lines: string[]) => {
      if (!lines.length) return
      if (abortRef.current) throw new Error('Cancelled by user')
      const res = await processCsvChunk(jobId, headerLine, lines.join('\n'))
      processed  += res.processed
      skipped    += res.skipped
      autoMapped += res.auto_mapped
      needsReview += res.needs_review
      chunksSent++
      setState(s => ({ ...s, currentChunk: chunksSent, processed, skipped, autoMapped, needsReview }))
    }

    try {
      const stream = file.stream().pipeThrough(new TextDecoderStream('utf-8'))
      const reader = stream.getReader()

      // Read first decoder chunk to extract the header line
      let firstChunk = true
      // eslint-disable-next-line no-constant-condition
      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break
        lineBuffer += value
        const parts = lineBuffer.split('\n')
        lineBuffer = parts.pop() ?? ''

        for (const line of parts) {
          if (firstChunk) {
            headerLine = line
            firstChunk = false

            // Create the job now that we have the header
            jobId = await createCsvImportJob(filename)
            setState(s => ({ ...s, phase: 'uploading', totalLines: 0, totalChunks: 0 }))
            continue
          }
          if (!line.trim()) continue
          totalLines++
          pending.push(line)
          if (pending.length >= CHUNK_LINES) {
            if (abortRef.current) break outer
            await flushChunk(pending)
            pending = []
          }
        }
      }

      // Flush remainder of lineBuffer
      if (lineBuffer.trim()) { totalLines++; pending.push(lineBuffer) }
      if (pending.length) await flushChunk(pending)

      if (!headerLine) throw new Error('File appears empty or has no header row.')

      const result = await finishCsvImportJob(jobId)
      setState(s => ({ ...s, phase: 'done', result, totalLines }))
      onDone()

    } catch (e) {
      const msg = String(e)
      if (jobId) await failCsvImportJob(jobId, msg).catch(() => {})
      setState(s => ({
        ...s, phase: 'error',
        error: msg.includes('Cancelled') ? 'Import cancelled.' : 'Import failed: ' + msg,
      }))
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const pct = state.totalLines > 0
    ? Math.min(100, Math.round((state.processed + state.skipped) / state.totalLines * 100))
    : (state.phase === 'uploading' ? null : 0)

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
            <span className={styles.progressPct}>{pct !== null ? `${pct}%` : 'Streaming…'}</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: pct !== null ? `${pct}%` : '100%', opacity: pct !== null ? 1 : 0.4 }} />
          </div>
          <div className={styles.progressStats}>
            <Stat label="Chunks sent" value={state.currentChunk.toLocaleString()} />
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
  const [resetting, setResetting] = useState(false)
  const [result, setResult] = useState<{ products_upserted: number; pages_imported: number; error: string | null } | null>(null)

  const loadCategories = () =>
    getCategories().then(cats => {
      setCategories(cats)
      setSelected(prev => {
        if (prev) return cats.find(c => c.slug === prev.slug) ?? cats[0] ?? null
        return cats[0] ?? null
      })
    })

  useEffect(() => { loadCategories() }, [])

  const runImport = async () => {
    if (!selected) return
    setImporting(true)
    setResult(null)
    try {
      const res = await triggerImport(selected.slug, selected.off_tag, maxPages)
      setResult(res)
      onDone()
      loadCategories()
    } catch (err) {
      setResult({ products_upserted: 0, pages_imported: 0, error: String(err) })
    } finally {
      setImporting(false)
    }
  }

  const handleReset = async () => {
    if (!selected) return
    if (!confirm(`Reset the high-water mark for "${selected.display_name}"? The next pull will re-fetch from the beginning of the catalogue.`)) return
    setResetting(true)
    try {
      await resetCategoryWatermark(selected.slug)
      loadCategories()
    } finally {
      setResetting(false)
    }
  }

  const watermark = selected?.last_modified_since
    ? new Date(selected.last_modified_since * 1000).toLocaleString()
    : null

  return (
    <>
      <h2 className={styles.cardTitle}>Pull from OFF API</h2>
      <p className={styles.cardDesc}>
        Fetches products from OpenFoodFacts modified <strong>after the last pull</strong> for
        each category — so every run brings genuinely new products. 50 per page.
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
        {selected && (
          <div className={styles.watermarkRow}>
            {watermark
              ? <span className={styles.watermarkLabel}>Last pulled up to: <strong>{watermark}</strong></span>
              : <span className={styles.watermarkNever}>Never pulled — will fetch from the full catalogue</span>}
            {watermark && (
              <button className={styles.resetLink} onClick={handleReset} disabled={resetting} type="button">
                {resetting ? 'Resetting…' : 'Reset'}
              </button>
            )}
          </div>
        )}
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
