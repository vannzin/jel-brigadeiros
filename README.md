# 🍬 J&L Brigadeiros - Sistema de Encomendas & Painel Administrativo

Sistema completo e responsivo para encomendas de doces artesanais, confeitaria e gestão de produção da **J&L Brigadeiros**.

---

## 🚂 Como Hospedar na Railway (Passo a Passo Rápido)

O projeto já está 100% configurado para a **Railway** com `package.json`, `server.js`, `railway.json` e `Dockerfile`.

### Opção 1: Via GitHub (Recomendada)
1. Crie um repositório no seu GitHub (ex: `jel-brigadeiros`).
2. Envie os arquivos desta pasta para o repositório no GitHub:
   ```bash
   git init
   git add .
   git commit -m "Deploy J&L Brigadeiros"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/jel-brigadeiros.git
   git push -u origin main
   ```
3. Acesse **[railway.com](https://railway.com)** e faça login com sua conta do GitHub.
4. Clique em **"New Project"** ➔ **"Deploy from GitHub repo"** e selecione o repositório `jel-brigadeiros`.
5. A Railway fará a detecção e o deploy automático em menos de 1 minuto!
6. Clique no seu serviço no painel da Railway, vá em **"Settings"** ➔ **"Networking"** ➔ **"Generate Domain"**.
7. Pronto! Seu site estará no ar em um link gratuito como: `https://jel-brigadeiros.up.railway.app`

---

## 📋 Tabela de Preços e Produtos Configurados

| Produto | 50 Unidades | 100 Unidades (Cento) | Personalização |
| :--- | :---: | :---: | :--- |
| **Brigadeiro Tradicional** | R$ 80,00 | R$ 140,00 | Sabores: Chocolate, Morango, Cajuzinho, Coco, Ninho |
| **Brigadeiro Especial** | R$ 90,00 | R$ 170,00 | Até 2 sabores (Prestígio, Coco queimado, Amendoim Crocante, Amendoim c/ Chocolate, Casadinho, Sensação) |
| **Brigadeiros Temáticos p/ Festas** | R$ 120,00 | R$ 230,00 | Temas personalizados, paleta de cores e forminhas |
| **Doces Personalizados no Carimbo** | R$ 100,00 | R$ 180,00 | Carimbos de afeto, iniciais, números ou frases |

---

## 🚀 Estrutura dos Arquivos

1. **🛍️ Loja do Cliente (`index.html`)**:
   - Cardápio, personalização de brigadeiros, checkout e canal de dicas/sugestões.
2. **🔐 Painel Administrativo (`admin.html`)**:
   - Gestão de encomendas (Kanban), gráficos, comandas de impressão e agenda de entregas.
   - **PIN Padrão:** `1234`
