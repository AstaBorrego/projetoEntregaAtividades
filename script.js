// Importa a função de inicialização da aplicação a partir do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
// Importa o serviço de analytics da biblioteca do Firebase
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
// Importa as funções de autenticação do Firebase para realizar o login
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
// Importa as funções do Firestore para gerenciar banco de dados, documentos e consultas
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// Definição das credenciais e parâmetros de configuração do projeto Firebase
const firebaseConfig = {
  // Chave de API única do projeto no Firebase
  apiKey: "AIzaSyAjwv9_na1rBCKXDR4VnwrggUYxz976Pfc",
  // Domínio utilizado para autenticação
  authDomain: "projetoatividade-4d976.firebaseapp.com",
  // Identificador exclusivo do projeto
  projectId: "projetoatividade-4d976",
  // Bucket de armazenamento de arquivos do Firebase
  storageBucket: "projetoatividade-4d976.firebasestorage.app",
  // ID da conta de mensagens para envio de notificações
  messagingSenderId: "834912903495",
  // Identificador da aplicação web cadastrada
  appId: "1:834912903495:web:574e7d47340777e7296c62",
  // Identificador de medição para o Google Analytics
  measurementId: "G-1HJQS7S0RE"
};

// Inicializa a aplicação do Firebase com as configurações informadas
const app = initializeApp(firebaseConfig);
// Inicializa o serviço de Analytics da aplicação
const analytics = getAnalytics(app);
// Obtém a instância do serviço de Autenticação do Firebase
const auth = getAuth(app);
// Obtém a instância do serviço de Banco de Dados Firestore
const db = getFirestore(app);

// Variável global temporária para guardar a lista de atividades obtidas do banco
let listaAtividades = [];

// Função global atribuída ao objeto window para realizar a navegação entre telas
window.showScreen = function(screenId) {
  // Remove a classe 'active' de todas as telas cadastradas no sistema
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  // Adiciona a classe 'active' apenas na tela passada por parâmetro para torná-la visível
  document.getElementById(screenId).classList.add('active');
  
  // Reseta os estilos e limpa os textos de todas as divs de mensagens
  document.querySelectorAll('.message').forEach(m => {
    // Restaura a classe padrão da mensagem
    m.className = 'message';
    // Limpa o conteúdo interno da mensagem
    m.innerText = '';
  });
};

// Manipulador de evento de envio do formulário do Aluno para cadastrar a atividade
document.getElementById('studentForm').addEventListener('submit', async (e) => {
  // Impede que o formulário recarregue a página após a submissão
  e.preventDefault();
  // Obtém a div de mensagem da tela do aluno
  const msgDiv = document.getElementById('studentMsg');
  
  // Captura e remove espaços extras do nome do aluno
  const nomeAluno = document.getElementById('nomeAluno').value.trim();
  // Captura o valor do polo selecionado se existir algum checado
  const polo = document.querySelector('input[name="polo"]:checked')?.value;
  // Captura o valor do turno selecionado se existir algum checado
  const turno = document.querySelector('input[name="turno"]:checked')?.value;
  // Captura o valor do módulo selecionado se existir algum checado
  const modulo = document.querySelector('input[name="modulo"]:checked')?.value;
  // Captura e remove espaços extras da descrição da atividade
  const descricao = document.getElementById('descricao').value.trim();
  // Captura e remove espaços extras da URL do trabalho
  const urlTrabalho = document.getElementById('urlTrabalho').value.trim();

  // Validação personalizada que verifica se todos os campos estão devidamente preenchidos
  if (!nomeAluno || !polo || !turno || !modulo || !descricao || !urlTrabalho) {
    // Define a classe de estilo para mensagem de erro
    msgDiv.className = "message error";
    // Exibe o texto de erro para o aluno
    msgDiv.innerText = "Todos os campos devem ser preenchidos";
    // Interrompe o processo de envio
    return;
  }

  // Bloco try-catch para tratar a tentativa de gravação no banco de dados
  try {
    // Adiciona um novo documento na coleção "atividade" com os dados preenchidos
    await addDoc(collection(db, "atividade"), {
      // Grava o nome do aluno
      nomeAluno,
      // Grava o polo selecionado
      polo,
      // Grava o turno selecionado
      turno,
      // Grava o módulo selecionado
      modulo,
      // Grava o texto descritivo
      descricao,
      // Grava a URL para o trabalho
      urlTrabalho,
      // Grava a nota inicial como vazia ou nula
      nota: "",
      // Registra a data e hora do momento de envio
      dataEnvio: new Date()
    });

    // Define a classe da mensagem para o estilo de sucesso
    msgDiv.className = "message success";
    // Exibe a mensagem confirmando o envio
    msgDiv.innerText = "Atividade enviada com sucesso!";
    // Limpa todos os campos do formulário do aluno
    document.getElementById('studentForm').reset();
  } catch (error) {
    // Define a classe da mensagem para o estilo de erro em caso de falha na gravação
    msgDiv.className = "message error";
    // Exibe o texto do erro retornado do Firebase
    msgDiv.innerText = "Erro ao enviar atividade: " + error.message;
  }
});

// Manipulador do formulário de Login do Professor para autenticação no sistema
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  // Evita a atualização padrão da página na submissão
  e.preventDefault();
  // Obtém o elemento de mensagem da tela de login
  const msgDiv = document.getElementById('loginMsg');
  // Captura o valor digitado do e-mail do professor sem espaços extras
  const email = document.getElementById('profEmail').value.trim();
  // Captura a senha informada
  const password = document.getElementById('profPassword').value.trim();

  // Verifica se o e-mail ou a senha foram deixados em branco
  if (!email || !password) {
    // Configura mensagem com estilo visual de erro
    msgDiv.className = "message error";
    // Exibe o alerta para o usuário
    msgDiv.innerText = "Todos os campos devem ser preenchidos";
    // Interrompe a execução
    return;
  }

  // Tenta realizar a autenticação do professor através do Firebase Auth
  try {
    // Executa a instrução de login com e-mail e senha
    await signInWithEmailAndPassword(auth, email, password);
    // Direciona o professor autenticado para o seu painel de controle
    showScreen('teacherDashboard');
    // Chama a função para carregar a lista de alunos cadastrados na ComboBox
    carregarAlunosProfessor();
  } catch (error) {
    // Configura o estilo de erro caso a autenticação falhe
    msgDiv.className = "message error";
    // Exibe mensagem de credenciais inválidas
    msgDiv.innerText = "Usuário/Senha inválidos ou não cadastrados.";
  }
});

// Função responsável por buscar todos os alunos gravados e popular a ComboBox do Professor
async function carregarAlunosProfessor() {
  // Obtém a referência do select de consulta de alunos
  const selectAluno = document.getElementById('selectAluno');
  // Define o conteúdo inicial da ComboBox
  selectAluno.innerHTML = '<option value="">-- Selecione um Aluno --</option>';

  // Bloco try para execução da consulta no banco
  try {
    // Executa a busca de todos os documentos presentes na coleção 'atividade'
    const querySnapshot = await getDocs(collection(db, "atividade"));
    // Reinicializa a matriz local de atividades
    listaAtividades = [];

    // Percorre cada documento trazido da busca
    querySnapshot.forEach((docSnap) => {
      // Extrai os dados do documento
      const data = docSnap.data();
      // Insere o objeto com os dados e o id único do documento na lista local
      listaAtividades.push({ id: docSnap.id, ...data });
    });

    // Ordena os registros obtidos em ordem alfabética pelo nome do aluno
    listaAtividades.sort((a, b) => (a.nomeAluno || '').localeCompare(b.nomeAluno || ''));

    // Itera sobre cada registro ordenado para criar as options na ComboBox
    listaAtividades.forEach((item) => {
      // Cria dinamicamente um novo elemento do tipo option
      const opt = document.createElement('option');
      // Define o id do documento como o valor do elemento option
      opt.value = item.id;
      // Define o nome do aluno como o texto exibido na opção
      opt.textContent = item.nomeAluno || 'Aluno sem nome';
      // Adiciona a opção criada no elemento select
      selectAluno.appendChild(opt);
    });
  } catch (error) {
    // Exibe alerta na tela caso haja falha no carregamento dos dados
    alert("Erro ao carregar lista de alunos: " + error.message);
  }
}

// Manipulador de evento disparado quando o professor altera a seleção na ComboBox de aluno
document.getElementById('selectAluno').addEventListener('change', (e) => {
  // Captura o id do aluno selecionado na ComboBox
  const idSelecionado = e.target.value;
  // Busca o objeto correspondente dentro da lista local de atividades
  const alunoObj = listaAtividades.find(a => a.id === idSelecionado);

  // Se nenhum aluno estiver selecionado, reseta todos os campos do formulário
  if (!alunoObj) {
    // Desmarca os botões de polo
    document.querySelectorAll('input[name="profPolo"]').forEach(r => r.checked = false);
    // Desmarca os botões de turno
    document.querySelectorAll('input[name="profTurno"]').forEach(r => r.checked = false);
    // Desmarca os botões de módulo
    document.querySelectorAll('input[name="profModulo"]').forEach(r => r.checked = false);
    // Limpa o campo de descrição
    document.getElementById('profDescricao').value = '';
    // Limpa a URL do trabalho
    document.getElementById('profUrlTrabalho').value = '';
    // Limpa a nota atribuída
    document.getElementById('profNota').value = '';
    // Encerra a função
    return;
  }

  // Preenche o campo de polo marcando o radio button correspondente ao cadastrado pelo aluno
  document.querySelectorAll('input[name="profPolo"]').forEach(r => {
    // Atribui verdadeiro se o valor do botão corresponder ao valor salvo no banco
    r.checked = (r.value === alunoObj.polo);
  });

  // Preenche o campo de turno marcando o radio button cadastrado
  document.querySelectorAll('input[name="profTurno"]').forEach(r => {
    // Atribui verdadeiro se o valor do botão for igual ao turno do aluno
    r.checked = (r.value === alunoObj.turno);
  });

  // Preenche o campo de módulo marcando o radio button cadastrado
  document.querySelectorAll('input[name="profModulo"]').forEach(r => {
    // Atribui verdadeiro se o valor do botão for igual ao módulo do aluno
    r.checked = (r.value === alunoObj.modulo);
  });

  // Preenche a caixa de descrição com o texto enviado pelo aluno
  document.getElementById('profDescricao').value = alunoObj.descricao || '';
  // Preenche a entrada de URL com o endereço web do trabalho do aluno
  document.getElementById('profUrlTrabalho').value = alunoObj.urlTrabalho || '';
  // Preenche o campo exclusivo de nota com a nota previamente cadastrada ou em branco
  document.getElementById('profNota').value = alunoObj.nota !== undefined ? alunoObj.nota : '';
});

// Evento do botão para abrir o link do trabalho em uma nova aba do navegador
document.getElementById('btnAbrirLink').addEventListener('click', () => {
  // Obtém o valor presente na caixa de texto da URL
  const url = document.getElementById('profUrlTrabalho').value;
  // Verifica se existe uma URL preenchida
  if (url) {
    // Abre o endereço web informado em uma nova aba
    window.open(url, '_blank');
  } else {
    // Notifica o professor caso não exista URL carregada
    alert("Nenhum link disponível.");
  }
});

// Evento para o botão do professor de salvar a nota do aluno no Firestore
document.getElementById('btnSalvarNota').addEventListener('click', async () => {
  // Obtém o elemento de mensagens do painel do professor
  const teacherMsg = document.getElementById('teacherMsg');
  // Obtém o ID do aluno selecionado atualmente no dropdown
  const idSelecionado = document.getElementById('selectAluno').value;
  // Captura o valor digitado no campo de nota
  const nota = document.getElementById('profNota').value;

  // Garante que um aluno foi previamente selecionado antes de salvar
  if (!idSelecionado) {
    // Aplica o estilo visual de erro na mensagem
    teacherMsg.className = "message error";
    // Exibe texto informando a obrigatoriedade da seleção do aluno
    teacherMsg.innerText = "Por favor, selecione um aluno para atribuir a nota.";
    // Encerra a execução do manipulador
    return;
  }

  // Tenta realizar a atualização do documento no banco Firestore
  try {
    // Cria a referência do documento específico do aluno utilizando seu ID
    const docRef = doc(db, "atividade", idSelecionado);
    // Atualiza apenas a propriedade de nota dentro do documento do banco
    await updateDoc(docRef, { nota: nota });

    // Atualiza a nota dentro da lista local mantida no navegador
    const aluno = listaAtividades.find(a => a.id === idSelecionado);
    // Se o objeto for encontrado atualiza o atributo localmente
    if (aluno) aluno.nota = nota;

    // Define a classe de estilo para sucesso
    teacherMsg.className = "message success";
    // Exibe mensagem informando a gravação bem-sucedida da nota
    teacherMsg.innerText = "Nota salva com sucesso!";
  } catch (error) {
    // Define a classe de estilo para falha
    teacherMsg.className = "message error";
    // Exibe mensagem com o motivo do erro
    teacherMsg.innerText = "Erro ao salvar a nota: " + error.message;
  }
});

// Alterna a exibição do select do polo dependendo da opção de relatório escolhida
const tipoImpressaoSelect = document.getElementById('tipoImpressao');
// Associa evento de mudança de seleção na modalidade de impressão
tipoImpressaoSelect.addEventListener('change', () => {
  // Captura qual valor foi selecionado no filtro
  const tipo = tipoImpressaoSelect.value;
  // Exibe o select de polo somente se o tipo for 'polo', senão esconde
  document.getElementById('grupoSelectPolo').style.display = (tipo === 'polo') ? 'block' : 'none';
});

// Manipulador do botão para Imprimir o Aluno Selecionado individualmente
document.getElementById('btnImprimirSelecionado').addEventListener('click', () => {
  // Captura o ID do aluno selecionado no dropdown
  const idSelecionado = document.getElementById('selectAluno').value;
  // Tenta localizar o aluno dentro da lista local de registros
  const aluno = listaAtividades.find(a => a.id === idSelecionado);

  // Exibe alerta informando erro caso nenhum aluno esteja selecionado
  if (!aluno) {
    alert("Selecione um aluno na consulta para imprimir sua ficha.");
    return;
  }

  // Obtém a div receptora dos dados de impressão
  const printArea = document.getElementById('printArea');
  
  // Monta a estrutura HTML com os dados do aluno em formato de ficha de página única
  let html = `
    <div class="print-page">
      <h2>Ficha de Avaliação Acadêmica</h2>
      <p><strong>Nome do Aluno:</strong> ${aluno.nomeAluno || 'Não informado'}</p>
      <p><strong>Polo:</strong> ${aluno.polo || 'Não informado'}</p>
      <p><strong>Turno:</strong> ${aluno.turno || 'Não informado'}</p>
      <p><strong>Módulo:</strong> ${aluno.modulo || 'Não informado'}</p>
      <p><strong>Descrição:</strong> ${aluno.descricao || 'Sem descrição'}</p>
      <p><strong>Link do Trabalho:</strong> ${aluno.urlTrabalho || 'Sem link'}</p>
      <p><strong>Nota Atribuída:</strong> ${aluno.nota !== undefined && aluno.nota !== '' ? aluno.nota : 'Não avaliado'}</p>
    </div>
  `;

  // Insere o HTML montado na área de impressão do documento
  printArea.innerHTML = html;

  // Aguarda um pequeno intervalo para garantir a renderização do HTML antes da impressão
  setTimeout(() => {
    // Abre a caixa nativa de impressão do navegador
    window.print();
  }, 300);
});

// Manipulador de evento para o botão de Imprimir Relatório Geral (uma página por aluno)
document.getElementById('btnImprimirGeral').addEventListener('click', async () => {
  // Obtém o tipo de filtro selecionado no select do tipo de impressão
  const tipo = document.getElementById('tipoImpressao').value;
  // Obtém a div destinada a armazenar o conteúdo para impressão
  const printArea = document.getElementById('printArea');
  // Define texto temporário enquanto efetua a busca de dados
  printArea.innerHTML = "<p>Carregando dados para impressão...</p>";

  // Bloco try para capturar dados do banco para o relatório geral
  try {
    // Inicializa a consulta apontando para a coleção inteira de atividades
    let q = collection(db, "atividade");
    
    // Altera a consulta com filtro where caso a modalidade escolhida seja por polo
    if (tipo === 'polo') {
      // Captura o polo selecionado no combobox de filtro
      const poloSelecionado = document.getElementById('selectPoloFiltro').value;
      // Define a consulta filtrando os documentos pelo campo de polo
      q = query(collection(db, "atividade"), where("polo", "==", poloSelecionado));
    }

    // Executa a busca assíncrona no Firestore
    const querySnapshot = await getDocs(q);
    
    // Verifica se a busca retornou vazia e notifica o usuário caso positivo
    if (querySnapshot.empty) {
      alert("Nenhuma atividade encontrada para esse critério.");
      // Reseta a área de impressão
      printArea.innerHTML = "";
      // Interrompe o processo
      return;
    }

    // Inicializa variável que acumulará o HTML das páginas individuais
    let html = '';

    // Itera por todos os documentos retornados do banco de dados
    querySnapshot.forEach((docSnap) => {
      // Extrai os dados contidos no documento
      const data = docSnap.data();
      // Cria uma div com a classe 'print-page' que possui quebra de página configurada no CSS
      html += `
        <div class="print-page">
          <h2>Relatório de Entrega Acadêmica</h2>
          <p><strong>Nome do Aluno:</strong> ${data.nomeAluno || 'Não informado'}</p>
          <p><strong>Polo:</strong> ${data.polo || 'Não informado'}</p>
          <p><strong>Turno:</strong> ${data.turno || 'Não informado'}</p>
          <p><strong>Módulo:</strong> ${data.modulo || 'Não informado'}</p>
          <p><strong>Descrição:</strong> ${data.descricao || 'Sem descrição'}</p>
          <p><strong>Link do Trabalho:</strong> ${data.urlTrabalho || 'Sem link'}</p>
          <p><strong>Nota Atribuída:</strong> ${data.nota !== undefined && data.nota !== '' ? data.nota : 'Não avaliado'}</p>
        </div>
      `;
    });

    // Insere todo o código HTML gerado dentro do elemento printArea
    printArea.innerHTML = html;

    // Pausa a execução brevemente para o navegador desenhar os elementos
    setTimeout(() => {
      // Invoca a janela de impressão do sistema operacional
      window.print();
    }, 500);

  } catch (error) {
    // Exibe mensagem ao usuário em caso de falha durante a recuperação de registros
    alert("Erro ao gerar relatório: " + error.message);
    // Limpa a área de impressão
    printArea.innerHTML = "";
  }
});