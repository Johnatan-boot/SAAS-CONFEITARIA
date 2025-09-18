# 🍰 SaaS Confeitaria  

## 📌 Sobre o projeto  
O **SaaS Confeitaria** é uma plataforma desenvolvida para auxiliar confeitarias e pequenos negócios do setor alimentício a **gerenciar pedidos, clientes, estoque e feedbacks** de forma simples e eficiente.  
O sistema busca entregar **organização, praticidade e escalabilidade**, permitindo que o confeiteiro foque no que realmente importa: **a produção e venda de seus produtos**.  

---

## 💡 Dores enfrentadas no desenvolvimento  
- Integração entre **frontend (HTML/JS)** e **backend (Express + SQLite)**.  
- Tratamento de **autenticação e autorização** para proteger rotas da API.  
- Sincronização automática do **estoque de produtos** com os pedidos finalizados.  
- Estruturação do banco de dados para suportar **pedidos com múltiplos itens**.  
- Garantir **responsividade e usabilidade** em telas de cadastro, login e dashboard.  

---

## 🛠️ Tecnologias Utilizadas  
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)  
- **Backend**: Node.js + Express.js  
- **Banco de Dados**: SQLite3  
- **Controle de versão**: Git & GitHub  

---

## 🎯 Problemas que resolve no mercado  
- 📦 Controle de **estoque automático** (redução de erros em quantidades disponíveis).  
- 🧾 Gestão de **pedidos e pagamentos** em tempo real.  
- 👩‍🍳 Cadastro de clientes e histórico de compras.  
- ⭐ Coleta de **feedbacks** para melhorar produtos e serviços.  
- 📊 Relatórios e métricas para apoiar a tomada de decisão.  

---

## 🚀 Objetivo  
Ser uma solução **acessível e prática** para digitalizar e profissionalizar a gestão de confeitarias, ajudando pequenos empreendedores a crescer no mercado.  

---

## ⚙️ Instalação e execução  

### 1️⃣ Clone o repositório  
```bash
git clone https://github.com/seu-usuario/saas-confeitaria.git
cd saas-confeitaria
2️⃣ Instale as dependências
bash
Copiar código
npm install
3️⃣ Configure o banco de dados
O banco de dados SQLite será criado automaticamente na primeira execução, com as tabelas:

users

clients

products

orders

order_items

feedbacks

4️⃣ Execute o servidor
bash
Copiar código
node server.js
5️⃣ Acesse no navegador
arduino
Copiar código
http://localhost:3000
📬 Contribuição
Faça um fork do projeto

Crie uma branch para sua feature (git checkout -b feature/nova-feature)

Faça o commit (git commit -m 'Adiciona nova feature')

Envie para o repositório remoto (git push origin feature/nova-feature)

Abra um Pull Request

📝 Licença
Este projeto está sob a licença MIT.

