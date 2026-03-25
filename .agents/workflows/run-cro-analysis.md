---
description: Como executar uma análise completa de CRO Competitivo
---

Este fluxo de trabalho descreve os passos para realizar uma análise competitiva de ponta a ponta usando a Suite CRO Pro.

### Pré-requisitos
- Ter o Node.js instalado.
- Ter as dependências instaladas (`npm install`).

### Passos

1. **Descoberta de Concorrentes**
   - Use a skill `cro-discovery` para identificar os principais concorrentes no nicho desejado.
   - Isso gerará um arquivo `competitors.json`.

2. **Captura de Screenshots**
   - Use a skill `cro-capture` para capturar as landing pages dos concorrentes listados no `competitors.json`.
   - As imagens serão salvas na pasta do cliente.

3. **Análise de CRO**
   - Use a skill `cro-analyzer` para analisar as screenshots e o `competitors.json`.
   - O agente aplicará heurísticas de conversão e gerará um relatório HTML premium.

4. **Organização dos Resultados**
   - Mova os arquivos gerados para a pasta `data/[Nome do Cliente]/`.
