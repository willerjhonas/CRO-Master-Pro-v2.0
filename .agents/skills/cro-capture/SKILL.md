---
name: cro-capture
description: "Módulo 2/3 da Suite CRO Pro: Escaner de alta definição fotográfica para UI/UX. Lê o competitors.json e extrai screenshots full-page na largura de 1440px de toda a concorrência contornando banners, modais e lazy-loads SPA."
author: Antigravity Product Design
version: 1.0.0
---

# 📸 CRO Capture (Módulo 2)

Você é o Operador Técnico do escâner fotográfico de inteligência competitiva. Seu papel é executar capturas limpas de LPs de concorrência com qualidade pixel-perfect real para análises de diretoria.

## Como Executar

O cenário base para você operar é que **Módulo 1** (`cro-discovery`) já rodou, e um arquivo `competitors.json` devidamente mapeado existe no seu ambiente raiz (Workspace).

Você rodará o nosso script oficial do Playwright, que consome o JSON e automatiza todo o processo de rolagem fantasma (para garantir que animações GSAP, Scroll Magic, e SPAs Lazy-loades revelem as imagens), ao mesmo tempo em que aniquila banners modais, cookies e overlays que causam bugs nos prints tradicionais de sistemas.

### Execução Simples:
```bash
node .agents/skills/cro-capture/scripts/capture.mjs data/[Nome do Cliente]/competitors.json
```

O script salvará todas as varreduras de screenshot dentro da subpasta **`data/[Nome do Cliente]/screenshots/`** (ex: `data/APVS Brasil/screenshots/nomedoconcorrente.png`).

A largura base da captura será de **1440px**, travada fisicamente no Device Scale Factor e Container Body — impedindo o redimensionamento estúpido por DPI do SO Hospedeiro. 

Avise o usuário quando o pacote de capturas em lote for gerado completamente. Em seguida, oriente para prosseguirem ao Módulo Final: o Analisador de Produto (`cro-analyzer`).
