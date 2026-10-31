import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import {
  Activity,
  BrainCircuit,
  Database,
  FileSearch,
  GitBranch,
  LayoutDashboard,
  Network,
  Radio,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react'

import DocumentWorkspace from './components/DocumentWorkspace'
import KnowledgeGraphWorkspace from './components/KnowledgeGraphWorkspace'
import AIInvestigationWorkspace from './components/AIInvestigationWorkspace'
import './App.css'

type DocumentRecord = {
  id: string
  filename: string
  uploaded_at: string
  total_pages: number
  total_characters: number
}

type DocumentsResponse = {
  documents: DocumentRecord[]
  total_documents: number
}

type Workspace =
  | 'Overview'
  | 'Documents'
  | 'Knowledge Graph'
  | 'AI Investigation'

const navigation = [
  { label: 'Overview' as Workspace, icon: LayoutDashboard },
  { label: 'Documents' as Workspace, icon: FileSearch },
  { label: 'Knowledge Graph' as Workspace, icon: Network },
  { label: 'AI Investigation' as Workspace, icon: BrainCircuit },
]

function App() {
  const [activeTab, setActiveTab] = useState<Workspace>('Overview')
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<
    string | null
  >(null)
  const [backendOnline, setBackendOnline] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshDocuments = useCallback(async () => {
    const response = await fetch('/api/documents')

    if (!response.ok) {
      throw new Error('Unable to retrieve documents')
    }

    const data: DocumentsResponse = await response.json()

    setDocuments(data.documents)

    setSelectedDocumentId((current) => {
      if (
        current &&
        data.documents.some((document) => document.id === current)
      ) {
        return current
      }

      return data.documents[0]?.id ?? null
    })
  }, [])

  useEffect(() => {
    async function initializeSystem() {
      try {
        const healthResponse = await fetch('/api/health')

        if (!healthResponse.ok) {
          throw new Error('Backend unavailable')
        }

        await refreshDocuments()
        setBackendOnline(true)
      } catch {
        setBackendOnline(false)
      } finally {
        setLoading(false)
      }
    }

    void initializeSystem()
  }, [refreshDocuments])

  const handleDocumentsChanged = useCallback(async () => {
    await refreshDocuments()
    setBackendOnline(true)
  }, [refreshDocuments])

  return (
    <div className="synapse-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-symbol">
            <BrainCircuit size={26} />
          </div>

          <div>
            <h1>
              SYNAPSE<span>//AI</span>
            </h1>
            <p>COGNITIVE INTELLIGENCE</p>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.label}
                className={`nav-item ${
                  activeTab === item.label ? 'active' : ''
                }`}
                onClick={() => setActiveTab(item.label)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <div className="system-card-heading">
              <Radio size={16} />
              SYSTEM STATUS
            </div>

            <div className="system-status">
              <span
                className={`status-dot ${
                  backendOnline ? 'online' : 'offline'
                }`}
              />

              {loading
                ? 'CONNECTING'
                : backendOnline
                  ? 'ALL SYSTEMS ONLINE'
                  : 'BACKEND OFFLINE'}
            </div>

            <p>Investigation intelligence platform</p>
          </div>

          <div className="sidebar-footer">
            SYNAPSE INTELLIGENCE ENGINE
            <span>VERSION 1.0.0</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            INTELLIGENCE WORKSPACE
            <span>/</span>
            <strong>{activeTab.toUpperCase()}</strong>
          </div>

          <div className="topbar-right">
            <span className="live-indicator">
              <span
                className={`status-dot ${
                  backendOnline ? 'online' : 'offline'
                }`}
              />
              {backendOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
            </span>

            <div className="avatar">S</div>
          </div>
        </header>

        <div className="dashboard-content">
          <motion.div
            className="page-heading"
            key={activeTab}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="eyebrow">
              <Sparkles size={15} />
              NEXT-GENERATION INVESTIGATION INTELLIGENCE
            </div>

            <h2>
              {activeTab === 'Overview' ? (
                <>
                  Cognitive <span>Command Center</span>
                </>
              ) : activeTab === 'Documents' ? (
                <>
                  Document <span>Intelligence</span>
                </>
              ) : activeTab === 'Knowledge Graph' ? (
                <>
                  Knowledge <span>Graph</span>
                </>
              ) : (
                <>
                  AI <span>Investigation</span>
                </>
              )}
            </h2>

            <p>
              {activeTab === 'Overview'
                ? 'Transform unstructured evidence into connected intelligence. Investigate relationships, uncover patterns, and explore document-driven insights.'
                : activeTab === 'Documents'
                  ? 'Upload investigation reports, explore extracted evidence, and inspect detected entities.'
                  : activeTab === 'Knowledge Graph'
                    ? 'Explore evidence-linked entities and relationships across investigation documents.'
                    : 'Investigate document evidence using natural-language questions and explainable findings.'}
            </p>
          </motion.div>

          {activeTab === 'Overview' && (
            <>
              <section className="stats-grid">
                <StatCard
                  icon={<Database size={22} />}
                  label="DOCUMENTS INDEXED"
                  value={String(documents.length).padStart(2, '0')}
                  detail="Persisted investigation records"
                  delay={0.1}
                />

                <StatCard
                  icon={<GitBranch size={22} />}
                  label="KNOWLEDGE ENGINE"
                  value={backendOnline ? 'ACTIVE' : 'OFFLINE'}
                  detail="Evidence-linked graph analysis"
                  delay={0.2}
                />

                <StatCard
                  icon={<BrainCircuit size={22} />}
                  label="SEMANTIC ENGINE"
                  value={backendOnline ? 'AVAILABLE' : 'OFFLINE'}
                  detail="Embedding-powered retrieval"
                  delay={0.3}
                />

                <StatCard
                  icon={<ShieldCheck size={22} />}
                  label="BACKEND CONNECTION"
                  value={backendOnline ? 'ONLINE' : 'OFFLINE'}
                  detail="FastAPI intelligence services"
                  delay={0.4}
                />
              </section>

              <section className="workspace-grid">
                <motion.div
                  className="glass-panel intelligence-panel"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.3,
                    duration: 0.7,
                  }}
                >
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">
                        CORE SYSTEM
                      </span>
                      <h3>Neural Intelligence Matrix</h3>
                    </div>

                    <span className="panel-badge">
                      <Activity size={13} />
                      ACTIVE
                    </span>
                  </div>

                  <div className="neural-stage">
                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />
                    <div className="orbit orbit-three" />

                    <motion.div
                      className="neural-core"
                      animate={{
                        scale: [1, 1.08, 1],
                        boxShadow: [
                          '0 0 35px rgba(0,229,255,.25)',
                          '0 0 80px rgba(0,229,255,.55)',
                          '0 0 35px rgba(0,229,255,.25)',
                        ],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <BrainCircuit
                        size={56}
                        strokeWidth={1.2}
                      />
                    </motion.div>

                    <div className="orbit-point point-one" />
                    <div className="orbit-point point-two" />
                    <div className="orbit-point point-three" />
                  </div>

                  <div className="matrix-footer">
                    <span>SEMANTIC PROCESSING</span>
                    <span>RELATIONSHIP MAPPING</span>
                    <span>EVIDENCE ANALYSIS</span>
                  </div>
                </motion.div>

                <motion.div
                  className="glass-panel operations-panel"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.45,
                    duration: 0.7,
                  }}
                >
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">
                        QUICK ACCESS
                      </span>
                      <h3>Investigation Operations</h3>
                    </div>
                  </div>

                  <button
                    className="operation-item"
                    onClick={() => setActiveTab('Documents')}
                  >
                    <div className="operation-icon cyan">
                      <UploadCloud size={23} />
                    </div>

                    <div>
                      <strong>Document Intelligence</strong>
                      <p>Import and analyze investigation reports</p>
                    </div>

                    <span className="operation-arrow">↗</span>
                  </button>

                  <button
                    className="operation-item"
                    onClick={() =>
                      setActiveTab('Knowledge Graph')
                    }
                  >
                    <div className="operation-icon violet">
                      <Network size={23} />
                    </div>

                    <div>
                      <strong>Relationship Explorer</strong>
                      <p>Visualize evidence-linked connections</p>
                    </div>

                    <span className="operation-arrow">↗</span>
                  </button>

                  <button
                    className="operation-item"
                    onClick={() =>
                      setActiveTab('AI Investigation')
                    }
                  >
                    <div className="operation-icon blue">
                      <BrainCircuit size={23} />
                    </div>

                    <div>
                      <strong>AI Investigation Assistant</strong>
                      <p>Ask questions grounded in document evidence</p>
                    </div>

                    <span className="operation-arrow">↗</span>
                  </button>
                </motion.div>
              </section>

              <section className="glass-panel documents-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">
                      INVESTIGATION ARCHIVE
                    </span>
                    <h3>Recent Documents</h3>
                  </div>

                  <span className="document-count">
                    {documents.length} RECORDS
                  </span>
                </div>

                {documents.length === 0 ? (
                  <div className="empty-documents">
                    <FileSearch size={30} />
                    <p>
                      {backendOnline
                        ? 'No investigation documents have been indexed.'
                        : 'Connect to the backend to load documents.'}
                    </p>
                  </div>
                ) : (
                  <div className="document-list">
                    {documents.slice(0, 5).map((document) => (
                      <div
                        className="document-row"
                        key={document.id}
                      >
                        <div className="document-icon">
                          <FileSearch size={19} />
                        </div>

                        <div className="document-info">
                          <strong>{document.filename}</strong>
                          <span>
                            {document.total_pages} PAGE(S) ·{' '}
                            {document.total_characters} CHARACTERS
                          </span>
                        </div>

                        <span className="document-status">
                          INDEXED
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === 'Documents' && (
            <DocumentWorkspace
              documents={documents}
              onDocumentsChanged={handleDocumentsChanged}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={setSelectedDocumentId}
            />
          )}

          {activeTab === 'Knowledge Graph' && (
            <KnowledgeGraphWorkspace
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={setSelectedDocumentId}
            />
          )}

          {activeTab === 'AI Investigation' && (
            <AIInvestigationWorkspace
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={setSelectedDocumentId}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  detail,
  delay,
}: {
  icon: ReactNode
  label: string
  value: string
  detail: string
  delay: number
}) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.5,
      }}
    >
      <div className="stat-icon">{icon}</div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-detail">{detail}</span>
    </motion.div>
  )
}

export default App