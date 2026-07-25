import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from '@capacitor-community/sqlite'
import type {
  HistoryRepository,
  SaveHistoryInput,
  StoredHistoryEntry,
} from '../../types/history.ts'
import type {
  InputType,
  ScanResult,
  ScanVerdict,
  SupportedLanguage,
} from '../../types/analysis.ts'
import { inputAsText } from '../analysis/urlUtils.ts'

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    screenshot_path TEXT,
    input_type TEXT NOT NULL,
    input_preview TEXT NOT NULL,
    verdict TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    summary TEXT NOT NULL,
    full_report TEXT NOT NULL,
    language TEXT NOT NULL
  );
`

type ScanRow = {
  id: number
  scanned_at: string
  screenshot_path: string | null
  input_type: InputType
  input_preview: string
  verdict: ScanVerdict
  risk_score: number
  summary: string
  full_report: string
  language: SupportedLanguage
}

function previewFor(value: SaveHistoryInput): string {
  return value.input.type === 'screenshot'
    ? '[Screenshot]'
    : inputAsText(value.input).trim().slice(0, 100)
}

function rowToEntry(row: ScanRow): StoredHistoryEntry {
  return {
    id: row.id,
    scannedAt: row.scanned_at,
    screenshotPath: row.screenshot_path,
    inputType: row.input_type,
    inputPreview: row.input_preview,
    verdict: row.verdict,
    riskScore: row.risk_score,
    summary: row.summary,
    fullReport: JSON.parse(row.full_report) as ScanResult,
    language: row.language,
  }
}

export class SqliteHistoryRepository implements HistoryRepository {
  readonly #sqlite = new SQLiteConnection(CapacitorSQLite)
  #connection: SQLiteDBConnection | null = null

  async #database(): Promise<SQLiteDBConnection> {
    if (this.#connection) {
      return this.#connection
    }

    const consistency = await this.#sqlite.checkConnectionsConsistency()
    const hasConnection = await this.#sqlite.isConnection(
      'clickshield',
      false,
    )
    this.#connection =
      consistency.result && hasConnection.result
        ? await this.#sqlite.retrieveConnection('clickshield', false)
        : await this.#sqlite.createConnection(
            'clickshield',
            false,
            'no-encryption',
            1,
            false,
          )
    await this.#connection.open()
    await this.#connection.execute(CREATE_TABLE_SQL)
    return this.#connection
  }

  async save(value: SaveHistoryInput): Promise<StoredHistoryEntry> {
    const database = await this.#database()
    const result = await database.run(
      `INSERT INTO scans (
        scanned_at, screenshot_path, input_type, input_preview, verdict,
        risk_score, summary, full_report, language
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        value.result.scannedAt,
        value.screenshotPath ?? null,
        value.input.type,
        previewFor(value),
        value.result.verdict,
        value.result.riskScore,
        value.result.summary,
        JSON.stringify(value.result),
        value.result.language,
      ],
    )
    const id = result.changes?.lastId
    if (typeof id !== 'number') {
      throw new Error('SQLite did not return an id for the saved scan.')
    }
    const entry = await this.getById(id)
    if (!entry) {
      throw new Error('Saved scan could not be loaded from SQLite.')
    }
    return entry
  }

  async list(limit = 100): Promise<StoredHistoryEntry[]> {
    const database = await this.#database()
    const result = await database.query(
      'SELECT * FROM scans ORDER BY scanned_at DESC LIMIT ?',
      [Math.max(0, limit)],
    )
    return (result.values ?? []).map((row) => rowToEntry(row as ScanRow))
  }

  async getById(id: number): Promise<StoredHistoryEntry | null> {
    const database = await this.#database()
    const result = await database.query(
      'SELECT * FROM scans WHERE id = ? LIMIT 1',
      [id],
    )
    const row = result.values?.[0]
    return row ? rowToEntry(row as ScanRow) : null
  }

  async delete(id: number): Promise<void> {
    const database = await this.#database()
    await database.run('DELETE FROM scans WHERE id = ?', [id])
  }

  async clear(): Promise<void> {
    const database = await this.#database()
    await database.run('DELETE FROM scans')
  }
}
