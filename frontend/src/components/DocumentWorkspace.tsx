import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileSearch,
  FileText,
  LoaderCircle,
  UploadCloud,
} from 'lucide-react'

type DocumentRecord = {
  id: string
  filename: string
  uploaded_at: string
  total_pages: number
  total_characters: number
}

type Entity = {
  text: string
  label: string
  start: number
  end: number
}

type DocumentPage = {
  page_number: number
  text: string
  character_count: number
  nlp_analysis?: {
    total_entities: number
    entities: Entity[]
  }
}

type FullDocument = DocumentRecord & {
  document_data: {
    pages: DocumentPage[]
    total_pages: number
    total_characters: number
  }
}

type Props = {
  documents: DocumentRecord[]
  onDocumentsChanged: () => Promise<void>
  selectedDocumentId: string | null
  onSelectDocument: (id: string) => void
}

export default function DocumentWorkspace({
  documents,
  onDocumentsChanged,
  selectedDocumentId,
  onSelectDocument,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [document, setDocument] = useState<FullDocument | null>(null)
  const [loadingDocument, setLoadingDocument] = useState(false)

  useEffect(() => {
    if (!selectedDocumentId) {
      setDocument(null)
      return
    }

    let cancelled = false

    async function loadDocument() {
      setLoadingDocument(true)
      setError('')

      try {
        const response = await fetch(
          `/api/documents/${selectedDocumentId}`
        )

        if (!response.ok) {
          throw new Error('Unable to retrieve document')
        }

        const data = await response.json()

        if (!cancelled) {
          setDocument(data.document)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Document loading failed'
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingDocument(false)
        }
      }
    }

    void loadDocument()

    return () => {
      cancelled = true
    }
  }, [selectedDocumentId])

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF documents are supported.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Maximum PDF size is 10 MB.')
      return
    }

    setUploading(true)
    setMessage('')
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Document upload failed')
      }

      if (result.status !== 'PROCESSED') {
        throw new Error(
          result.message || 'Document could not be processed'
        )
      }

      await onDocumentsChanged()
      onSelectDocument(result.document_id)

      setMessage(`${file.name} processed and indexed successfully.`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Upload failed'
      )
    } finally {
      setUploading(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const pages = document?.document_data.pages || []

  const entities = pages.flatMap(
    (page) => page.nlp_analysis?.entities || []
  )

  return (
    <div className="document-workspace">
      <div className="glass-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">DOCUMENT INGESTION</span>
            <h3>Evidence Upload</h3>
          </div>
          <UploadCloud size={22} color="#00e5ff" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]

            if (file) {
              void uploadFile(file)
            }
          }}
        />

        <button
          className="upload-zone"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <LoaderCircle className="spin-icon" size={35} />
          ) : (
            <UploadCloud size={35} />
          )}

          <strong>
            {uploading
              ? 'Analyzing investigation document...'
              : 'Upload Investigation Report'}
          </strong>

          <span>PDF documents · Maximum 10 MB</span>
        </button>

        {message && (
          <div className="workspace-message success">
            <CheckCircle2 size={17} />
            {message}
          </div>
        )}

        {error && (
          <div className="workspace-message error">
            <AlertCircle size={17} />
            {error}
          </div>
        )}
      </div>

      <div className="document-workspace-grid">
        <div className="glass-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">EVIDENCE LIBRARY</span>
              <h3>Indexed Documents</h3>
            </div>

            <span className="document-count">
              {documents.length} RECORDS
            </span>
          </div>

          <div className="workspace-document-list">
            {documents.length === 0 && (
              <div className="empty-documents">
                No documents available.
              </div>
            )}

            {documents.map((item) => (
              <button
                key={item.id}
                className={`workspace-document-item ${
                  selectedDocumentId === item.id ? 'selected' : ''
                }`}
                onClick={() => onSelectDocument(item.id)}
              >
                <FileText size={21} />

                <div>
                  <strong>{item.filename}</strong>
                  <span>
                    {item.total_pages} pages ·{' '}
                    {item.total_characters} characters
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">EVIDENCE INSPECTION</span>
              <h3>Document Intelligence</h3>
            </div>

            <FileSearch size={21} color="#00e5ff" />
          </div>

          {loadingDocument ? (
            <div className="empty-documents">
              Loading document intelligence...
            </div>
          ) : !document ? (
            <div className="empty-documents">
              Select a document to inspect its contents.
            </div>
          ) : (
            <div className="document-inspection">
              <h4>{document.filename}</h4>

              <div className="inspection-stats">
                <span>{document.total_pages} PAGES</span>
                <span>{document.total_characters} CHARACTERS</span>
                <span>{entities.length} ENTITIES</span>
              </div>

              <div className="evidence-text">
                {pages.map((page) => (
                  <div key={page.page_number}>
                    <div className="evidence-page-label">
                      PAGE {page.page_number}
                    </div>

                    <p>{page.text}</p>
                  </div>
                ))}
              </div>

              <div className="entity-section">
                <h4>Detected Entities</h4>

                <div className="entity-tags">
                  {entities.length === 0 ? (
                    <span>No entities detected.</span>
                  ) : (
                    entities.map((entity, index) => (
                      <span
                        className="entity-tag"
                        key={`${entity.start}-${index}`}
                      >
                        {entity.text}
                        <small>{entity.label}</small>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}