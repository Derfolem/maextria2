# GitHub Configuration - MAEXTRIA

Este diretório contém todas as configurações de automação e CI/CD do projeto.

## 📂 Estrutura

```
.github/
├── workflows/
│   ├── ci.yml          # ✅ Continuous Integration
│   ├── cd.yml          # 🚀 Continuous Deployment
│   └── security.yml    # 🔒 Security Checks
├── dependabot.yml      # 🤖 Dependency Updates
├── CICD_SETUP.md       # 📖 Guia completo de CI/CD
└── README.md           # 📄 Este arquivo
```

## 🚀 Quick Start

### 1. Configure Secrets

Vá em: **Settings** → **Secrets and variables** → **Actions**

Adicione os secrets necessários (veja `CICD_SETUP.md`)

### 2. Ative os Workflows

Os workflows são ativados automaticamente ao fazer push para `main` ou `develop`.

### 3. Monitore

Acesse: https://github.com/Derfolem/maextria2/actions

---

## 📋 Workflows Disponíveis

| Workflow | Trigger | Descrição |
|----------|---------|-----------|
| **CI** | Push/PR | Testes, build e validações |
| **CD** | Push (main) | Deploy automático |
| **Security** | Push/Agendado | Scans de segurança |

---

## 📚 Documentação

Leia o [**CICD_SETUP.md**](./CICD_SETUP.md) para documentação completa.

---

**Status:**
![CI](https://github.com/Derfolem/maextria2/workflows/CI/badge.svg)
![Security](https://github.com/Derfolem/maextria2/workflows/Security%20Checks/badge.svg)
