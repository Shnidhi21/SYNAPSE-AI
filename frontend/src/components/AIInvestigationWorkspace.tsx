import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Activity,
  AlertCircle,
  ArrowUp,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  FileSearch,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

type DocumentRecord = {
  id: string
  filename: string
  uploaded_at: string
  total_pages: number
  total_characters: number
}

type EvidenceSource = {
  page_number: number
  evidence: string
  similarity_score: number
  relevance_score: number
  assessment: string
}

type InvestigationResult = {
  query: string
  status: string
  answer: string
  assessment: string
  sources: EvidenceSource[]
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  investigation?: InvestigationResult
}

type Props = {
  documents: DocumentRecord[]
  selectedDocumentId: string | null
  onSelectDocument: (id: string) => void
}

const suggestedQuestions = [
  'What caused the shipment delay?',
  'What happened to the warehouse server?',
  'Which organization reported the incident?',
  'What evidence supports the investigation findings?',
]

function getAssessmentStyle(assessment: string) {
  const value = assessment.toUpperCase()

  if (value === 'DOCUMENTED') {
    return 'documented'
  }

  if (value === 'PRELIMINARY') {
    return 'preliminary'
  }

  return 'unknown'
}

export default function AIInvestigationWorkspace({
  documents,
  selectedDocumentId,
  onSelectDocument,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedSources, setExpandedSources] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMessages([])
    setError('')
    setExpandedSources([])
  }, [selectedDocumentId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }, [messages, loading])

  async function investigate(inputQuestion?: string) {
    const query = (inputQuestion ?? question).trim()

    if (!query || !selectedDocumentId || loading) {
      return
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
    }

    setMessages((previous) => [...previous, userMessage])
    setQuestion('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        `/api/documents/${selectedDocumentId}/investigate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            top_k: 3,
          }),
        }
      )

      if (!response.ok) {
        let detail = 'Unable to complete the investigation.'

        try {
          const errorData = await response.json()
          detail =
            typeof errorData.detail === 'string'
              ? errorData.detail
              : detail
        } catch {
          detail = `Investigation failed with HTTP ${response.status}.`
        }

        throw new Error(detail)
      }

      const data = await response.json()

      if (!data.investigation) {
        throw new Error('The backend returned an unexpected response.')
      }

      const investigation: InvestigationResult = data.investigation

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: investigation.answer,
        investigation,
      }

      setMessages((previous) => [...previous, assistantMessage])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected investigation error occurred.'
      )
    } finally {
      setLoading(false)
    }
  }

  function toggleSources(messageId: string) {
    setExpandedSources((previous) =>
      previous.includes(messageId)
        ? previous.filter((id) => id !== messageId)
        : [...previous, messageId]
    )
  }

  const selectedDocument = documents.find(
    (document) => document.id === selectedDocumentId
  )

  return (
    <div className="ai-investigation-workspace">
      <div className="glass-panel ai-investigation-toolbar">
        <div>
          <span className="panel-kicker">COGNITIVE INVESTIGATION ENGINE</span>
          <h3>Evidence-Grounded AI Assistant</h3>
          <p>
            Investigate uploaded reports using semantic retrieval and
            source-linked analysis.
          </p>
        </div>

        <div className="ai-document-selector">
          <FileSearch size={18} />

          <select
            value={selectedDocumentId ?? ''}
            onChange={(event) => onSelectDocument(event.target.value)}
          >
            {documents.length === 0 && (
              <option value="">No documents available</option>
            )}

            {documents.map((document) => (
              <option key={document.id} value={document.id}>
                {document.filename} — {document.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ai-investigation-layout">
        <div className="glass-panel ai-chat-panel">
          <div className="ai-chat-header">
            <div className="ai-chat-header-left">
              <div className="ai-assistant-avatar">
                <BrainCircuit size={23} />
              </div>

              <div>
                <strong>SYNAPSE Intelligence</strong>
                <span>
                  <span className="ai-live-dot" />
                  EVIDENCE ANALYSIS READY
                </span>
              </div>
            </div>

            <span className="ai-model-badge">
              <Sparkles size={13} />
              INVESTIGATION MODE
            </span>
          </div>

          <div className="ai-chat-messages">
            {messages.length === 0 && (
              <motion.div
                className="ai-welcome"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="ai-welcome-orbit">
                  <div className="ai-welcome-orbit-ring" />

                  <div className="ai-welcome-core">
                    <BrainCircuit size={47} strokeWidth={1.3} />
                  </div>
                </div>

                <span className="panel-kicker">
                  INTELLIGENCE INTERFACE INITIALIZED
                </span>

                <h3>What would you like to investigate?</h3>

                <p>
                  Ask questions about your investigation report.
                  SYNAPSE will retrieve relevant evidence and identify
                  whether the findings are documented or preliminary.
                </p>

                <div className="ai-suggested-questions">
                  {suggestedQuestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      disabled={!selectedDocumentId || loading}
                      onClick={() => void investigate(suggestion)}
                    >
                      <Sparkles size={14} />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`ai-message ai-message-${message.role}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="ai-message-avatar">
                    {message.role === 'assistant' ? (
                      <BrainCircuit size={19} />
                    ) : (
                      <span>S</span>
                    )}
                  </div>

                  <div className="ai-message-body">
                    <span className="ai-message-author">
                      {message.role === 'assistant'
                        ? 'SYNAPSE INTELLIGENCE'
                        : 'INVESTIGATOR'}
                    </span>

                    <div className="ai-message-content">
                      {message.content}
                    </div>

                    {message.investigation && (
                      <div className="ai-investigation-result">
                        <div className="ai-result-badges">
                          <span className="ai-result-status">
                            <CheckCircle2 size={13} />
                            {message.investigation.status.replaceAll(
                              '_',
                              ' '
                            )}
                          </span>

                          <span
                            className={`ai-assessment-badge ${getAssessmentStyle(
                              message.investigation.assessment
                            )}`}
                          >
                            <ShieldCheck size={13} />
                            {message.investigation.assessment}
                          </span>
                        </div>

                        <button
                          className="ai-sources-toggle"
                          onClick={() => toggleSources(message.id)}
                        >
                          <FileSearch size={15} />

                          {message.investigation.sources.length} Supporting
                          Sources

                          <ChevronDown
                            size={15}
                            className={
                              expandedSources.includes(message.id)
                                ? 'ai-chevron-open'
                                : ''
                            }
                          />
                        </button>

                        {expandedSources.includes(message.id) && (
                          <div className="ai-evidence-list">
                            {message.investigation.sources.map(
                              (source, index) => (
                                <div
                                  className="ai-evidence-card"
                                  key={`${message.id}-${index}`}
                                >
                                  <div className="ai-evidence-card-header">
                                    <span>
                                      SOURCE {String(index + 1).padStart(
                                        2,
                                        '0'
                                      )}
                                    </span>

                                    <span>
                                      PAGE {source.page_number}
                                    </span>
                                  </div>

                                  <p>{source.evidence}</p>

                                  <div className="ai-evidence-metadata">
                                    <span>
                                      RELEVANCE: {source.relevance_score}
                                    </span>

                                    <span>
                                      SIMILARITY:{' '}
                                      {(
                                        source.similarity_score * 100
                                      ).toFixed(1)}
                                      %
                                    </span>

                                    <span>{source.assessment}</span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="ai-thinking">
                <div className="ai-message-avatar">
                  <BrainCircuit size={19} />
                </div>

                <div>
                  <strong>SYNAPSE IS INVESTIGATING</strong>

                  <div className="ai-thinking-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="ai-chat-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="ai-chat-composer">
            <div className="ai-input-container">
              <textarea
                ref={inputRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask SYNAPSE about your investigation..."
                rows={2}
                disabled={!selectedDocumentId || loading}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void investigate()
                  }
                }}
              />

              <button
                className="ai-send-button"
                disabled={
                  !question.trim() || !selectedDocumentId || loading
                }
                onClick={() => void investigate()}
                aria-label="Send investigation question"
              >
                {loading ? (
                  <LoaderCircle size={19} className="spin-icon" />
                ) : (
                  <ArrowUp size={20} />
                )}
              </button>
            </div>

            <div className="ai-composer-footer">
              <span>
                <ShieldCheck size={13} />
                SOURCE-GROUNDED INVESTIGATION
              </span>

              <span>ENTER TO SEND · SHIFT + ENTER FOR NEW LINE</span>
            </div>
          </div>
        </div>

        <div className="ai-context-column">
          <div className="glass-panel ai-context-card">
            <span className="panel-kicker">ACTIVE INVESTIGATION</span>

            <h3>Evidence Context</h3>

            <div className="ai-context-document">
              <FileSearch size={22} />

              <div>
                <strong>
                  {selectedDocument?.filename ?? 'No document selected'}
                </strong>

                <span>
                  {selectedDocument
                    ? `${selectedDocument.total_pages} PAGES · ${selectedDocument.total_characters} CHARACTERS`
                    : 'UPLOAD A DOCUMENT TO BEGIN'}
                </span>
              </div>
            </div>

            <div className="ai-context-divider" />

            <div className="ai-context-stat">
              <span>INVESTIGATION STATUS</span>
              <strong>
                {selectedDocument ? 'READY' : 'WAITING'}
              </strong>
            </div>

            <div className="ai-context-stat">
              <span>QUESTIONS ASKED</span>
              <strong>
                {messages.filter((message) => message.role === 'user')
                  .length}
              </strong>
            </div>

            <div className="ai-context-stat">
              <span>ANALYSIS MODE</span>
              <strong>GROUNDED</strong>
            </div>
          </div>

          <div className="glass-panel ai-context-card">
            <span className="panel-kicker">INTELLIGENCE PROTOCOL</span>

            <h3>Analysis Pipeline</h3>

            <div className="ai-pipeline">
              <div>
                <Activity size={17} />
                <span>Semantic Retrieval</span>
                <CheckCircle2 size={15} />
              </div>

              <div>
                <FileSearch size={17} />
                <span>Evidence Extraction</span>
                <CheckCircle2 size={15} />
              </div>

              <div>
                <BrainCircuit size={17} />
                <span>Finding Assessment</span>
                <CheckCircle2 size={15} />
              </div>

              <div>
                <ShieldCheck size={17} />
                <span>Source Attribution</span>
                <CheckCircle2 size={15} />
              </div>
            </div>
          </div>

          <div className="ai-disclaimer">
            SYNAPSE analyzes uploaded evidence. Preliminary findings
            should not be treated as independently verified facts.
          </div>
        </div>
      </div>
    </div>
  )
}