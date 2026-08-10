# NFS-e Sherlock

Ferramenta de auditoria fiscal inteligente para NFSe. Cross-check de dados da Receita Federal (Brasil API) com XML de lotes RPS/DPS, validando conformidade com a LC 116/2003.

## Funcionalidades

- **Consulta de CNPJ** via Brasil API — dados cadastrais, CNAE, QSA, regime tributario
- **Upload e parse de XML** de NFSe (RPS/DPS) — extrai automaticamente tags fiscais
- **Auditoria geografica (IBGE)** — verifica se o ISS foi recolhido no municipio correto conforme LC 116/2003
- **Cross-check de aliquota** — detecta aliquotas zeradas em empresas nao-Simples
- **Divergencia de titularidade** — compara CNPJ do XML com o consultado

## Stack

### Web (Next.js)

```bash
cd web
npm install
npm run dev     # http://localhost:3000
npm run build   # build para producao
```

- Next.js 16 + TypeScript
- CSS Modules com design dark
- Client-side rendering (Brasil API + parse DOM)

### CLI (Python)

```bash
pip install -r requirements.txt
python main.py
```

Ferramenta legada de linha de comando para processamento de layouts de NFS-e.

## Deploy

- **Vercel:** [web-six-henna-21.vercel.app](https://web-six-henna-21.vercel.app)
- **Deploy:** automatico via Git (push na `main`)
