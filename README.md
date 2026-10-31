# SYNAPSE//AI

### Explainable Graph-Enhanced AI Investigation Platform



SYNAPSE//AI transforms unstructured PDF documents into searchable evidence, interconnected knowledge graphs, and explainable investigation results.



## Core Features



\- \*\*Document Intelligence:\*\* PDF text extraction and page-level analysis.

\- \*\*NLP Analysis:\*\* Named entity and relationship extraction using spaCy.

\- \*\*Knowledge Graph:\*\* Visual exploration of entities and their connections.

\- \*\*Semantic Search:\*\* Natural-language retrieval of relevant document passages.

\- \*\*AI Investigation:\*\* Evidence-grounded answers that distinguish documented events from preliminary findings.



## Technology Stack



| Layer | Technologies |

|---|---|

| Frontend | React, TypeScript, Vite |

| Styling | Tailwind CSS |

| Animation | Motion |

| Graph Visualization | React Flow |

| Backend | Python, FastAPI |

| NLP | spaCy |

| Semantic Retrieval | Sentence Transformers, Scikit-learn |

| Graph Processing | NetworkX |

| PDF Processing | PyMuPDF |

| Database | SQLite |



## Architecture



1\. PDF documents are uploaded through the React interface.

2\. FastAPI processes documents and extracts text.

3\. spaCy identifies entities and relationships.

4\. The graph engine builds connected knowledge structures.

5\. Semantic retrieval finds relevant evidence.

6\. The investigation engine generates evidence-grounded responses.

7\. The frontend presents documents, graphs, and investigation results.



## Project Structure



```text

SYNAPSE-AI/

├── backend/

│   ├── database.py

│   ├── document\_processor.py

│   ├── graph\_engine.py

│   ├── investigation\_engine.py

│   ├── main.py

│   ├── nlp\_engine.py

│   ├── relationship\_engine.py

│   └── semantic\_engine.py

├── frontend/

│   ├── src/

│   │   └── components/

│   ├── package.json

│   └── package-lock.json

├── create\_test\_pdf.py

├── requirements.txt

├── README.md

└── .gitignore

```



## Installation



### Prerequisites



\- Python 3.13

\- Node.js and npm

\- Git



### 1. Clone the repository



```bash

git clone YOUR\_REPOSITORY\_URL

cd SYNAPSE-AI

```



Replace `YOUR\_REPOSITORY\_URL` with your actual repository URL.



### 2. Set up the backend



```powershell

python -m venv .venv

.\\.venv\\Scripts\\Activate.ps1

python -m pip install -r requirements.txt

```



### 3. Start the backend



```powershell

uvicorn backend.main:app --reload

```



Backend: `http://127.0.0.1:8000`



API documentation: `http://127.0.0.1:8000/docs`



### 4. Set up the frontend



Open another terminal:



```powershell

cd frontend

npm ci

npm run dev

```



Frontend: `http://localhost:5173`



### 5. Production build



```powershell

npm run build

```



## API Endpoints



| Method | Endpoint | Purpose |

|---|---|---|

| GET | `/health` | Backend health check |

| POST | `/documents/upload` | Upload and process PDF |

| GET | `/documents` | List documents |

| GET | `/documents/{document\_id}` | Retrieve document |

| GET | `/documents/{document\_id}/graph` | Generate knowledge graph |

| POST | `/documents/{document\_id}/search` | Search document evidence |

| POST | `/documents/{document\_id}/investigate` | Investigate document |



## Reliability and Responsible Use



\- Investigation responses are grounded in retrieved document evidence.

\- Documented events are distinguished from preliminary findings.

\- Extracted relationships may require human verification.

\- Scanned PDFs may require OCR.

\- Investigation results are decision-support outputs, not independent proof of wrongdoing.

\- Original documents should be reviewed before operational or legal decisions.



## Future Development



\- OCR and multilingual document processing.

\- Cross-document entity resolution.

\- Temporal event correlation.

\- Advanced graph-based investigation.

\- Analyst feedback and evidence verification.

\- Role-based access control and audit logging.



\---



\*\*SYNAPSE//AI — From fragmented information to connected intelligence.\*\*
