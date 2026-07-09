const fs = require('fs');
const https = require('https');

function generateMermaidPng(mermaidText, filename) {
    const encoded = Buffer.from(mermaidText).toString('base64');
    const url = 'https://mermaid.ink/img/' + encoded;
    
    https.get(url, (res) => {
        if (res.statusCode === 200) {
            const file = fs.createWriteStream(filename);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('Saved ' + filename);
            });
        } else {
            console.error('Failed to generate ' + filename + ': HTTP ' + res.statusCode);
        }
    }).on('error', (err) => {
        console.error('Error: ' + err.message);
    });
}

const arch = `graph TD
    Client[React Frontend] --> API[FastAPI Backend]
    API --> Service[Ticket Service]
    API --> Agent[LangChain Agent]
    Service --> Repo[Ticket Repository]
    Repo --> DB[(PostgreSQL)]
    Agent <--> VectorDB[(Qdrant Vector DB)]
    Agent --> LLM[OpenAI / LLM]
    Agent --> Tools[Agent Tools]
    Tools --> Service`;
generateMermaidPng(arch, 'docs/Architecture.png');

const seq = `sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Agent
    participant DB
    
    User->>Frontend: Send chat message
    Frontend->>API: POST /chat
    API->>Agent: Invoke LangChain
    Agent->>Agent: Decide to use tool
    Agent->>DB: Tool accesses Repository
    DB-->>Agent: Return ticket data
    Agent->>Agent: Synthesize final answer
    Agent-->>API: Return response text
    API-->>Frontend: { status: success, data: ... }
    Frontend-->>User: Display answer`;
generateMermaidPng(seq, 'docs/SequenceDiagram.png');

const er = `erDiagram
    ADMIN_USER {
        int id
        string username
        string password_hash
    }
    TICKET {
        int id
        string ticket_number
        string user_email
        string summary
        string status
        string priority
    }
    TICKET_MESSAGE {
        int id
        int ticket_id
        string sender
        string message
        datetime timestamp
    }
    TICKET ||--o{ TICKET_MESSAGE : has`;
generateMermaidPng(er, 'docs/ERDiagram.png');

const dep = `graph TD
    subgraph Docker_Host
        subgraph Frontend_Container
            Nginx[Nginx]
            React[React Build]
            Nginx --> React
        end
        subgraph Backend_Container
            Uvicorn[Uvicorn ASGI]
            FastAPI[FastAPI App]
            Uvicorn --> FastAPI
        end
        subgraph DB_Container
            PG[(PostgreSQL)]
        end
        subgraph Vector_Container
            Qd[(Qdrant)]
        end
    end
    Internet((Internet)) --> Nginx
    Nginx --> Uvicorn
    FastAPI --> PG
    FastAPI --> Qd`;
generateMermaidPng(dep, 'docs/DeploymentDiagram.png');
