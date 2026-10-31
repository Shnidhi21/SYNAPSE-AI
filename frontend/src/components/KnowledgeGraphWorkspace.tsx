import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  AlertCircle,
  FileSearch,
  GitBranch,
  Network,
  X,
} from 'lucide-react'

type DocumentRecord = {
  id: string
  filename: string
  uploaded_at: string
  total_pages: number
  total_characters: number
}

type GraphNode = {
  id: string
  label: string
  type: string
}

type GraphEdge = {
  id: string
  source: string
  target: string
  relation: string
  evidence: string
  page_number: number
}

type GraphData = {
  total_nodes: number
  total_edges: number
  nodes: GraphNode[]
  edges: GraphEdge[]
}

type Props = {
  documents: DocumentRecord[]
  selectedDocumentId: string | null
  onSelectDocument: (id: string) => void
}

type IntelligenceNode = Node<{
  label: string
  category: string
}>

function classifyNode(label: string) {
  const value = label.toLowerCase()

  if (value.includes('shipment')) return 'shipment'
  if (value.includes('failure') || value.includes('delay')) return 'incident'
  if (value.includes('warehouse') || value.includes('server')) return 'infrastructure'
  if (value.includes('corporation') || value.includes('company')) return 'organization'
  if (value.includes('am') || value.includes('pm') || value.includes('hour')) return 'time'

  return 'entity'
}

function IntelligenceNodeComponent({ data }: NodeProps<IntelligenceNode>) {
  return (
    <div className={`intelligence-node category-${data.category}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="graph-handle"
      />

      <div className="intelligence-node-indicator" />

      <div className="intelligence-node-content">
        <span>{data.category.toUpperCase()}</span>
        <strong>{data.label}</strong>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="graph-handle"
      />
    </div>
  )
}

const nodeTypes = {
  intelligence: IntelligenceNodeComponent,
}

function createLayout(graph: GraphData) {
  const columns = Math.max(2, Math.ceil(Math.sqrt(graph.nodes.length)))
  const horizontalGap = 280
  const verticalGap = 155

  const nodes: IntelligenceNode[] = graph.nodes.map((item, index) => ({
    id: item.id,
    type: 'intelligence',
    position: {
      x: (index % columns) * horizontalGap,
      y: Math.floor(index / columns) * verticalGap,
    },
    data: {
      label: item.label,
      category: classifyNode(item.label),
    },
  }))

  const edges: Edge[] = graph.edges.map((item) => ({
    id: item.id,
    source: item.source,
    target: item.target,
    label: item.relation.replaceAll('_', ' '),
    type: 'smoothstep',
    animated: item.relation === 'CONTRIBUTED_TO',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#00d9ff',
    },
    style: {
      stroke: item.relation === 'CONTRIBUTED_TO' ? '#a78bfa' : '#00bcd4',
      strokeWidth: 1.8,
    },
    labelStyle: {
      fill: '#a9c4db',
      fontSize: 10,
      fontWeight: 600,
    },
    labelBgStyle: {
      fill: '#0b1325',
      fillOpacity: 0.95,
    },
    labelBgPadding: [7, 5],
    data: {
      evidence: item.evidence,
      page_number: item.page_number,
      relation: item.relation,
    },
  }))

  return { nodes, edges }
}

export default function KnowledgeGraphWorkspace({
  documents,
  selectedDocumentId,
  onSelectDocument,
}: Props) {
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null)

  useEffect(() => {
    if (!selectedDocumentId) {
      setGraph(null)
      return
    }

    let cancelled = false

    async function loadGraph() {
      setLoading(true)
      setError('')
      setSelectedEdge(null)
      setGraph(null)

      try {
        const response = await fetch(
          `/api/documents/${selectedDocumentId}/graph`
        )

        if (!response.ok) {
          throw new Error('Unable to retrieve the knowledge graph.')
        }

        const data = await response.json()

        if (!cancelled) {
          setGraph(data.graph)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Graph loading failed'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadGraph()

    return () => {
      cancelled = true
    }
  }, [selectedDocumentId])

  const layout = useMemo(
    () => (graph ? createLayout(graph) : { nodes: [], edges: [] }),
    [graph]
  )

  return (
    <div className="graph-workspace">
      <div className="glass-panel graph-toolbar">
        <div>
          <span className="panel-kicker">RELATIONSHIP INTELLIGENCE</span>
          <h3>Evidence Knowledge Network</h3>
        </div>

        <select
          className="graph-document-select"
          value={selectedDocumentId || ''}
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

      {error && (
        <div className="workspace-message error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="graph-statistics">
        <div>
          <Network size={20} />
          <span>ENTITIES</span>
          <strong>{graph?.total_nodes ?? 0}</strong>
        </div>

        <div>
          <GitBranch size={20} />
          <span>RELATIONSHIPS</span>
          <strong>{graph?.total_edges ?? 0}</strong>
        </div>

        <div>
          <FileSearch size={20} />
          <span>DOCUMENT SOURCE</span>
          <strong>{selectedDocumentId ? 'SELECTED' : 'NONE'}</strong>
        </div>
      </div>

      <div className="graph-layout">
        <div className="glass-panel graph-canvas-panel">
          <div className="graph-canvas-heading">
            <span>INTERACTIVE INTELLIGENCE MAP</span>
            <span>DRAG · ZOOM · EXPLORE</span>
          </div>

          <div className="graph-canvas">
            {loading ? (
              <div className="graph-placeholder">Constructing knowledge graph...</div>
            ) : !graph || graph.nodes.length === 0 ? (
              <div className="graph-placeholder">
                No extracted relationships available for this document.
              </div>
            ) : (
              <ReactFlow
                key={selectedDocumentId ?? 'empty'}
                nodes={layout.nodes}
                edges={layout.edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.25}
                maxZoom={2}
                nodesDraggable
                nodesConnectable={false}
                elementsSelectable
                onEdgeClick={(_, edge) => {
                  const relationship = graph.edges.find(
                    (item) => item.id === edge.id
                  )

                  setSelectedEdge(relationship || null)
                }}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#17314b" gap={24} size={1} />
                <Controls />
                <MiniMap
                  nodeColor="#00d9ff"
                  maskColor="rgba(3, 7, 18, 0.7)"
                />
              </ReactFlow>
            )}
          </div>
        </div>

        <div className="glass-panel graph-evidence-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">EXPLAINABLE INTELLIGENCE</span>
              <h3>Relationship Evidence</h3>
            </div>

            {selectedEdge && (
              <button
                className="graph-close-button"
                onClick={() => setSelectedEdge(null)}
                aria-label="Close evidence"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {selectedEdge ? (
            <div className="graph-evidence-details">
              <div className="graph-evidence-label">RELATIONSHIP</div>
              <strong>{selectedEdge.relation.replaceAll('_', ' ')}</strong>

              <div className="graph-evidence-label">SOURCE</div>
              <p>
                {graph?.nodes.find(
                  (node) => node.id === selectedEdge.source
                )?.label}
              </p>

              <div className="graph-evidence-label">TARGET</div>
              <p>
                {graph?.nodes.find(
                  (node) => node.id === selectedEdge.target
                )?.label}
              </p>

              <div className="graph-evidence-label">SUPPORTING EVIDENCE</div>

              <blockquote>{selectedEdge.evidence}</blockquote>

              <div className="graph-page-reference">
                DOCUMENT PAGE {selectedEdge.page_number}
              </div>
            </div>
          ) : (
            <div className="graph-evidence-empty">
              <Network size={40} />
              <p>Select a connection in the graph to inspect its supporting evidence.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}