# Sistema de Estimativa de Idade Facial por Reconhecimento Facial

Este projeto é uma plataforma profissional de Inteligência Artificial e Visão Computacional para detecção de faces, estimativa de idade, classificação de faixas etárias e análise de descritores biométricos estendidos em tempo real.

---

## 🛠️ Arquitetura do Sistema

O sistema é construído sobre uma arquitetura limpa de camadas (`Clean Architecture`), garantindo separação de conceitos, segurança cibernética de dados e fácil extensibilidade.

```
                  ┌────────────────────────┐
                  │      Interface web     │ (React + Tailwind + Motion)
                  └───────────┬────────────┘
                              │ HTTPS / JSON
                  ┌───────────▼────────────┐
                  │      Servidor API      │ (Express / Node.js)
                  └───────────┬────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
   ┌────────────────┐┌────────────────┐┌────────────────┐
   │  Motor de IA   ││ Banco de Dados ││   Segurança    │
   │  Gemini SDK    ││   JSON Store   ││ (SHA-256 Hash) │
   └────────────────┘└────────────────┘└────────────────┘
```

### Decisões Técnicas & Camadas

1. **Frontend (Camada de Apresentação):** 
   - Desenvolvido em **React** (Vite) e **TypeScript** estruturado sob o paradigma funcional e modular.
   - Design System inspirado nos padrões refinados de **Apple, OpenAI e Google**, com suporte nativo a **Dark Mode e Light Mode**, glassmorfismo e transições fluidas usando **Framer Motion**.
   - Integração direta com a API do navegador para acesso seguro a canais de Webcam de alta definição.

2. **Backend (Camada de Aplicação & Roteamento):**
   - Servidor **Express** (Node.js) configurado para rodar na porta `3000`.
   - Lazy-initialization do cliente de Inteligência Artificial para maior resiliência em ambientes sem chaves configuradas.

3. **Motor de IA (Camada de Serviços):**
   - Integração profunda com o modelo **Gemini 3.5 Flash** através da biblioteca `@google/genai` no lado do servidor.
   - Uso de `responseSchema` rígido e estruturado para extração segura de metadados das faces detectadas (bounding boxes 0-100%, idades, grupos demográficos, indicadores de nitidez e luz).

4. **Banco de Dados (Histórico local):**
   - Módulo robusto de armazenamento local em `/src/db/historyStore.ts` operando sobre persistência de arquivos locais.
   - Coleta de métricas operacionais automatizada (latência média, distribuição etária e auditoria de captura).

5. **Privacidade e Segurança:**
   - O sistema **nunca armazena imagens de rostos**.
   - As imagens recebidas por base64 são convertidas em um hash criptográfico **SHA-256** único (fingerprint) para salvar registros do histórico sem expor a identidade física do usuário.

---

## 📂 Estrutura de Pastas do Projeto

```
/
├── server.ts                    # Ponto de entrada do servidor Express full-stack
├── package.json                 # Manifesto de dependências e scripts de automação
├── metadata.json                # Configurações de permissões do iFrame (câmera)
├── tsconfig.json                # Configuração do compilador TypeScript
├── vite.config.ts               # Bundler de ativos de frontend
├── src/
│   ├── App.tsx                  # Dashboard principal unificado
│   ├── types.ts                 # Contratos de tipos estritos do sistema
│   ├── index.css                # Ponto de carregamento do Tailwind CSS e fontes
│   ├── main.tsx                 # Inicializador React 19
│   ├── db/
│   │   ├── historyStore.ts      # Manipulador do repositório de histórico local
│   │   └── history.json         # Arquivo físico de banco de dados
│   └── components/
│       ├── ThemeContext.tsx     # Contexto global de Dark/Light mode
│       ├── CameraView.tsx       # Módulo inteligente de captação da webcam
│       ├── FileUpload.tsx       # Carregador de arquivos arrastar-e-soltar
│       ├── ResultsView.tsx      # Exibidor de bounding boxes e telemetria por face
│       └── MetricsDashboard.tsx # Gráficos e cartões analíticos operacionais
```

---

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js (v18+)
- NPM ou Yarn

### Configuração de Variáveis
Crie um arquivo `.env` na raiz do projeto (ou configure suas variáveis no painel **Settings > Secrets** do AI Studio):
```env
GEMINI_API_KEY="SUA_CHAVE_AQUI"
APP_URL="http://localhost:3000"
```

### Instalação de Dependências
```bash
npm install
```

### Executar em Desenvolvimento (HMR desligado por conformidade da plataforma)
```bash
npm run dev
```
O terminal iniciará o servidor unificado em `http://localhost:3000`.

### Construção de Produção e Execução
```bash
# Compilar frontend estático e encapsular backend Node em CommonJS
npm run build

# Inicializar o servidor compilado em ambiente de container
npm run start
```

---

## 🐋 Execução via Docker (Opcional para Deploy)

Crie um arquivo `Dockerfile` na raiz do projeto para empacotar a aplicação:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
```

E construa o container:
```bash
docker build -t faceage-ai .
docker run -p 3000:3000 --env GEMINI_API_KEY="sua_chave" faceage-ai
```

---

## 🧪 Testes Automatizados

O sistema conta com tipagem estrita do compilador TypeScript (`tsc --noEmit`) integrado ao script de lint do projeto.

Para realizar auditorias estáticas de código e detecção de syntax bugs, execute:
```bash
npm run lint
```

Para validar a integridade da pipeline de builds de produção, execute:
```bash
npm run build
```

---

## 🔮 Roadmap & Melhorias Futuras

O motor biométrico estruturado no backend utilizando o Gemini já está totalmente preparado para futuras expansões de produto, enviando as seguintes telemetrias em modo Beta:
- **Análise Demográfica de Gênero:** Estimativa automatizada por amostragem.
- **Detecção de Microexpressões / Emoções:** Humor predominante da face (Feliz, Neutro, Surpreso, Triste, Bravo, Sério).
- **Indicadores Rápidos:** Presença de óculos de grau/sol e sorrisos.
- **Fadiga & Foco de Atenção:** Integração com sensores de telemetria industrial para monitoramento contínuo de cansaço.
