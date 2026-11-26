# Roteiro de testes manuais

Complementa os testes automáticos (unitários, e2e da API e e2e do navegador com Playwright, todos no
CI). Aqui fica o que teste automático não julga bem: **fidelidade visual ao Figma, sensação de uso,
teclado, celular de verdade e produção**.

- **Ambiente:** produção — <https://desafio-fs2-dr-2511.vercel.app> (ou local: `http://localhost:3099`).
- **Conta de teste:** `demo@exemplo.com` / `demo12345`.
- **Antes de começar:** abra <https://juscash-api-3xep.onrender.com/health> e espere
  `{"status":"ok"}` (a API gratuita "dorme" e leva ~50 s para acordar).
- **Figma de referência:** <https://www.figma.com/design/y8N01zjkPgv1rwc6W4xlt1/Case>.

Marque cada item. Se algo falhar, anote o passo, o que esperava e o que aconteceu (print ajuda).

**Executado por:** ______  **Data:** ___/___/______  **Navegador/dispositivo:** ______________

---

## 1. Login (`/login`)
- [ ] Layout igual ao Figma no desktop: ilustração à esquerda, card à direita, rodapé "© 2026 • Juscash…".
- [ ] Entrar com e-mail/senha errados mostra "E-mail ou senha incorretos…" com ícone, e os dois campos ficam vermelhos.
- [ ] Enquanto entra, o botão mostra o indicador de carregamento (pode ser rápido; com a API "dormindo" fica visível).
- [ ] O olho mostra e oculta a senha.
- [ ] "Cadastre-se" leva ao cadastro.
- [ ] `Tab` percorre os campos e botões em ordem lógica; `Enter` envia o formulário.
- [ ] Errar a senha 6 vezes em menos de 1 minuto mostra "Muitas tentativas em pouco tempo…" (rate limit). Espere 1 minuto e entre normalmente.

## 2. Cadastro (`/cadastro`)
- [ ] E-mail inválido → "Informe um e-mail válido."
- [ ] Senha com menos de 8 caracteres → "A senha deve ter no mínimo 8 caracteres."
- [ ] Senhas diferentes → "As senhas não coincidem." (os dois campos de senha ficam vermelhos e o texto "Mínimo de 8 caracteres" some, como no Figma).
- [ ] Cadastro válido entra direto em Comunicações, com as **iniciais do nome** no avatar.
- [ ] Repetir o mesmo e-mail (mesmo com maiúsculas) → "Este e-mail já está cadastrado."

## 3. Comunicações (`/comunicacoes`)
- [ ] Sem estar logado, abrir `/comunicacoes` leva ao login; depois de entrar, volta para a página pedida.
- [ ] Primeira carga mostra o skeleton (blocos cinza) e depois a lista, da mais recente para a mais antiga.
- [ ] Cada card mostra processo e classe, data, tribunal, tipo, destinatários e conteúdo truncado em 3 linhas.
- [ ] "Ler mais" mostra o texto completo; "Ler menos" recolhe.
- [ ] **Busca:** digitar o número aplica a máscara; com menos de 20 dígitos aparece a dica e não busca; com 20 dígitos (ex.: `2622250-13.2024.8.19.0546`) mostra só esse processo (3 comunicações).
- [ ] **Tribunal:** escolher TRT2 mostra só TRT2 (23 comunicações, 3 páginas).
- [ ] **Período:** o calendário abre com 2 meses; escolher 01/08/2025 e 31/08/2025 marca início e fim em verde e o intervalo em cinza; a lista só tem datas de agosto/2025; o "X" limpa o período.
- [ ] Filtros combinados (ex.: TJSP + agosto/2025) funcionam juntos.
- [ ] Filtro sem resultado (ex.: número `0000000-00.0000.0.00.0000`) mostra "Nenhuma comunicação encontrada".
- [ ] Paginação: "Anterior"/"Próximo"/números; a página atual fica destacada.
- [ ] **URL:** recarregar a página com filtros mantém os filtros; copiar o link e abrir em outra aba mostra a mesma busca; o botão "voltar" do navegador desfaz o último filtro.
- [ ] Erro de conexão (desligue o Wi-Fi e troque um filtro) mostra "Não foi possível carregar as comunicações" com "Tentar novamente"; religue e tente de novo.

## 4. Resumo com IA (bônus)
- [ ] "Resumir" abre o modal com carregando e depois o resumo e os destaques (ex.: "Prazo: 15 dias").
- [ ] Fecha pelo X, pelo botão "Fechar", pela tecla `Esc` e clicando fora.
- [ ] O aviso "Resumo automático… confira sempre o conteúdo integral" aparece.

## 5. Detalhes do processo (`/processos/:numero`)
- [ ] Clicar no número do processo de um card abre os detalhes.
- [ ] Processo `2622250-13.2024.8.19.0546`: selo "Transitou em julgado" no cabeçalho e na movimentação, com a expressão em **negrito vermelho** no texto.
- [ ] Cabeçalho: tribunal, destinatários e "3 atualizações", separados por linhas verticais.
- [ ] "Diário Oficial" (breadcrumb) volta para Comunicações.
- [ ] Número inexistente na URL mostra "Processo não encontrado".

## 6. Menu, sessão e avatar
- [ ] O avatar mostra as iniciais (conta demo: "UD"); o menu mostra nome e e-mail.
- [ ] "Sair" volta ao login; depois disso, `/comunicacoes` exige login de novo.
- [ ] O botão do painel (canto superior esquerdo) expande e recolhe o menu lateral.

## 7. Responsivo (celular de verdade ou DevTools: 360, 430, 768, 1024, 1920)
- [ ] Login/cadastro: abaixo de 1024 px some a ilustração e aparece o logo escuro + slogan acima do card.
- [ ] Comunicações no celular: sem menu lateral e sem logo na barra; o botão abre o menu por cima com fundo escurecido.
- [ ] Filtros empilhados abaixo de 1024 px; "Resumir" no topo do card no celular.
- [ ] Calendário no celular mostra 1 mês e cabe na tela.
- [ ] Nenhuma tela tem rolagem horizontal.

## 8. Comparação com o Figma (amostragem)
- [ ] Cores, fontes e espaçamentos batem com o Figma em pelo menos: login com erro, cadastro com "senhas não coincidem", lista, calendário aberto, estado vazio e processo.

## 9. API (Swagger) — <https://juscash-api-3xep.onrender.com/docs>
- [ ] `POST /auth/login` com a conta demo devolve `{ "accessToken": "..." }`.
- [ ] "Authorize" com o token e `GET /comunicacoes?pageSize=51` → 400; sem token → 401.
- [ ] `GET /comunicacoes?numeroProcesso=26222501320248190546` (sem máscara) e com máscara retornam o mesmo resultado.

---

**Resultado:** ☐ aprovado  ☐ aprovado com ressalvas  ☐ reprovado — **Observações:**
