// Importa as funções do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

// Inicializa a biblioteca do EmailJS com a Public Key
(function() {
  emailjs.init("Q8SiVr5mU4QBiKIK8");
})();

// Configuração do projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAjwv9_na1rBCKXDR4VnwrggUYxz976Pfc",
  authDomain: "projetoatividade-4d976.firebaseapp.com",
  projectId: "projetoatividade-4d976",
  storageBucket: "projetoatividade-4d976.firebasestorage.app",
  messagingSenderId: "834912903495",
  appId: "1:834912903495:web:574e7d47340777e7296c62",
  measurementId: "G-1HJQS7S0RE"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let listaAtividades = [];

// Lista de Frases de Incentivo Aleatórias
const frasesIncentivo = [
  "Parabéns, {NOME}! Seu empenho e dedicação são o caminho para o seu sucesso profissional. Continue assim!",
  "Excelente trabalho, {NOME}! Cada atividade entregue é um passo importante rumo ao seu grande futuro.",
  "Muito obrigado pela entrega, {NOME}! Seu compromisso com os estudos é admirável e faz toda a diferença.",
  "Atividade recebida com sucesso, {NOME}! Continue acreditando no seu potencial e superando desafios!",
  "Parabéns pelo empenho, {NOME}! O conhecimento que você está construindo hoje abrirá portas incríveis amanhã."
];

// Navegação entre telas
window.showScreen = function(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  
  document.querySelectorAll('.message').forEach(m => {
    m.className = 'message';
    m.innerText = '';
  });
};

// Fechar Modal de Sucesso
window.fecharModalSucesso = function() {
  const modal = document.getElementById('modalSucesso');
  modal.classList.remove('active');
};

// Envio do formulário do Aluno com foco automático no erro e Modal de Sucesso
document.getElementById('studentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgDiv = document.getElementById('studentMsg');
  
  const nomeInput = document.getElementById('nomeAluno');
  const emailInput = document.getElementById('emailAluno');
  const tituloInput = document.getElementById('tituloTrabalho');
  const descricaoInput = document.getElementById('descricao');
  const urlInput = document.getElementById('urlTrabalho');
  const fileInput = document.getElementById('arquivoTrabalho');

  const nomeAluno = nomeInput.value.trim();
  const emailAluno = emailInput.value.trim();
  const polo = document.querySelector('input[name="polo"]:checked')?.value;
  const turno = document.querySelector('input[name="turno"]:checked')?.value;
  const modulo = document.querySelector('input[name="modulo"]:checked')?.value;
  const tipoAvaliacao = document.querySelector('input[name="tipoAvaliacao"]:checked')?.value;
  const tituloTrabalho = tituloInput.value.trim();
  const descricao = descricaoInput.value.trim();
  const urlTrabalho = urlInput.value.trim();
  const arquivo = fileInput.files[0]; // Opcional

  // Mapeamento de campos OBRIGATÓRIOS para validação e rolagem de tela até o erro
  const camposValidacao = [
    { valor: nomeAluno, elem: nomeInput, grupoId: 'group-nomeAluno', msg: 'Por favor, preencha o Nome do Aluno.' },
    { valor: emailAluno, elem: emailInput, grupoId: 'group-emailAluno', msg: 'Por favor, informe o seu E-mail.' },
    { valor: polo, elem: null, grupoId: 'group-polo', msg: 'Por favor, selecione um Polo.' },
    { valor: turno, elem: null, grupoId: 'group-turno', msg: 'Por favor, selecione um Turno.' },
    { valor: modulo, elem: null, grupoId: 'group-modulo', msg: 'Por favor, selecione um Módulo.' },
    { valor: tipoAvaliacao, elem: null, grupoId: 'group-tipoAvaliacao', msg: 'Por favor, selecione o Tipo de Avaliação.' },
    { valor: tituloTrabalho, elem: tituloInput, grupoId: 'group-tituloTrabalho', msg: 'Por favor, preencha o Título do Trabalho.' },
    { valor: descricao, elem: descricaoInput, grupoId: 'group-descricao', msg: 'Por favor, insira a Observação / Descrição da Atividade.' },
    { valor: urlTrabalho, elem: urlInput, grupoId: 'group-urlTrabalho', msg: 'Por favor, insira o Link do Trabalho.' }
  ];

  // Identifica o primeiro campo pendente
  for (const item of camposValidacao) {
    if (!item.valor) {
      msgDiv.className = "message error";
      msgDiv.innerText = item.msg;

      const alvoGrupo = document.getElementById(item.grupoId);
      if (alvoGrupo) {
        alvoGrupo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (item.elem) {
        item.elem.focus();
      }
      return;
    }
  }

  try {
    msgDiv.className = "message success";
    msgDiv.innerText = "Enviando atividade...";

    let arquivoUrl = "";
    let nomeArquivoOriginal = "";

    // Upload do arquivo para o Firebase Storage (Apenas se o arquivo for fornecido)
    if (arquivo) {
      const timestamp = Date.now();
      const storageRef = ref(storage, `entregas/${timestamp}_${arquivo.name}`);
      const uploadResult = await uploadBytes(storageRef, arquivo);
      arquivoUrl = await getDownloadURL(uploadResult.ref);
      nomeArquivoOriginal = arquivo.name;
    }

    // Gravação no Firestore
    await addDoc(collection(db, "atividade"), {
      nomeAluno,
      emailAluno,
      polo,
      turno,
      modulo,
      tipoAvaliacao,
      tituloTrabalho,
      descricao,
      urlTrabalho,
      arquivoUrl,
      nomeArquivoOriginal,
      nota: "",
      comentario: "",
      dataEnvio: new Date()
    });

    // Limpa caixa de mensagens do topo e reseta o formulário
    msgDiv.className = "message";
    msgDiv.innerText = "";
    document.getElementById('studentForm').reset();

    // Sorteia a frase de incentivo com o nome do aluno
    const fraseSorteada = frasesIncentivo[Math.floor(Math.random() * frasesIncentivo.length)];
    const mensagemFinal = fraseSorteada.replace("{NOME}", nomeAluno);

    // Exibe o Modal
    document.getElementById('modalMensagemIncentivo').innerText = mensagemFinal;
    document.getElementById('modalSucesso').classList.add('active');

  } catch (error) {
    msgDiv.className = "message error";
    msgDiv.innerText = "Erro ao enviar atividade: " + error.message;
  }
});

// Login do Professor
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgDiv = document.getElementById('loginMsg');
  const email = document.getElementById('profEmail').value.trim();
  const password = document.getElementById('profPassword').value.trim();

  if (!email || !password) {
    msgDiv.className = "message error";
    msgDiv.innerText = "Todos os campos devem ser preenchidos";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showScreen('teacherDashboard');
    carregarAlunosProfessor();
  } catch (error) {
    msgDiv.className = "message error";
    msgDiv.innerText = "Usuário/Senha inválidos ou não cadastrados.";
  }
});

// Carregar alunos no Select do Professor
async function carregarAlunosProfessor() {
  const selectAluno = document.getElementById('selectAluno');
  selectAluno.innerHTML = '<option value="">-- Selecione um Aluno --</option>';

  try {
    const querySnapshot = await getDocs(collection(db, "atividade"));
    listaAtividades = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      listaAtividades.push({ id: docSnap.id, ...data });
    });

    listaAtividades.sort((a, b) => (a.nomeAluno || '').localeCompare(b.nomeAluno || ''));

    listaAtividades.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.nomeAluno || 'Aluno sem nome';
      selectAluno.appendChild(opt);
    });
  } catch (error) {
    alert("Erro ao carregar lista de alunos: " + error.message);
  }
}

// Preencher campos ao selecionar aluno
document.getElementById('selectAluno').addEventListener('change', (e) => {
  const idSelecionado = e.target.value;
  const alunoObj = listaAtividades.find(a => a.id === idSelecionado);

  const btnBaixarArquivo = document.getElementById('btnBaixarArquivo');
  const profNomeArquivo = document.getElementById('profNomeArquivo');

  if (!alunoObj) {
    document.getElementById('profEmailAluno').value = '';
    document.querySelectorAll('input[name="profPolo"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="profTurno"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="profModulo"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="profTipoAvaliacao"]').forEach(r => r.checked = false);
    document.getElementById('profTituloTrabalho').value = '';
    document.getElementById('profDescricao').value = '';
    document.getElementById('profUrlTrabalho').value = '';
    document.getElementById('profNota').value = '';
    document.getElementById('profComentario').value = '';
    
    profNomeArquivo.value = '';
    btnBaixarArquivo.style.display = 'none';
    btnBaixarArquivo.onclick = null;
    return;
  }

  document.getElementById('profEmailAluno').value = alunoObj.emailAluno || 'Não informado';
  document.querySelectorAll('input[name="profPolo"]').forEach(r => r.checked = (r.value === alunoObj.polo));
  document.querySelectorAll('input[name="profTurno"]').forEach(r => r.checked = (r.value === alunoObj.turno));
  document.querySelectorAll('input[name="profModulo"]').forEach(r => r.checked = (r.value === alunoObj.modulo));

  const tipo = alunoObj.tipoAvaliacao || 'Atividade';
  document.querySelectorAll('input[name="profTipoAvaliacao"]').forEach(r => r.checked = (r.value === tipo));

  document.getElementById('profTituloTrabalho').value = alunoObj.tituloTrabalho || '';
  document.getElementById('profDescricao').value = alunoObj.descricao || '';
  document.getElementById('profUrlTrabalho').value = alunoObj.urlTrabalho || '';
  document.getElementById('profNota').value = alunoObj.nota !== undefined ? alunoObj.nota : '';
  document.getElementById('profComentario').value = alunoObj.comentario !== undefined ? alunoObj.comentario : '';

  // Exibição e link de download do arquivo anexado
  if (alunoObj.arquivoUrl) {
    profNomeArquivo.value = alunoObj.nomeArquivoOriginal || "Arquivo anexado";
    btnBaixarArquivo.style.display = 'inline-block';
    btnBaixarArquivo.onclick = () => window.open(alunoObj.arquivoUrl, '_blank');
  } else {
    profNomeArquivo.value = "Nenhum arquivo anexado";
    btnBaixarArquivo.style.display = 'none';
    btnBaixarArquivo.onclick = null;
  }
});

// Abrir Link do Trabalho
document.getElementById('btnAbrirLink').addEventListener('click', () => {
  const url = document.getElementById('profUrlTrabalho').value;
  if (url) {
    window.open(url, '_blank');
  } else {
    alert("Nenhum link disponível.");
  }
});

// Salvar nota/comentário e tipo de avaliação e enviar EmailJS
document.getElementById('btnSalvarNota').addEventListener('click', async () => {
  const teacherMsg = document.getElementById('teacherMsg');
  const selectAluno = document.getElementById('selectAluno');
  const idSelecionado = selectAluno.value;
  const nota = document.getElementById('profNota').value;
  const comentario = document.getElementById('profComentario').value;
  const tipoAvaliacaoModificado = document.querySelector('input[name="profTipoAvaliacao"]:checked')?.value;

  if (!idSelecionado) {
    teacherMsg.className = "message error";
    teacherMsg.innerText = "Por favor, selecione um aluno para atribuir nota e comentário.";
    return;
  }

  try {
    const docRef = doc(db, "atividade", idSelecionado);
    await updateDoc(docRef, { 
      nota: nota,
      comentario: comentario,
      tipoAvaliacao: tipoAvaliacaoModificado
    });

    const aluno = listaAtividades.find(a => a.id === idSelecionado);
    if (aluno) {
      aluno.nota = nota;
      aluno.comentario = comentario;
      aluno.tipoAvaliacao = tipoAvaliacaoModificado;
    }

    if (aluno && aluno.emailAluno) {
      emailjs.init("Q8SiVr5mU4QBiKIK8");

      const templateParams = {
        to_email: aluno.emailAluno,
        name: aluno.nomeAluno || '',
        title: aluno.tituloTrabalho || 'Avaliação de Atividade',
        modulo: aluno.modulo || '',
        nota: nota,
        comentario: comentario || 'Sem comentários adicionais.'
      };

      await emailjs.send('service_2m6uvjh', 'template_bgkfhap', templateParams);
    }

    teacherMsg.className = "message success";
    teacherMsg.innerText = "Nota e Tipo de Avaliação salvos, e-mail enviado com sucesso!";

    document.getElementById('teacherForm').reset();
    document.getElementById('profEmailAluno').value = '';
    document.getElementById('profTituloTrabalho').value = '';
    document.getElementById('profDescricao').value = '';
    document.getElementById('profUrlTrabalho').value = '';
    document.getElementById('profNomeArquivo').value = '';
    document.getElementById('btnBaixarArquivo').style.display = 'none';
    document.getElementById('profNota').value = '';
    document.getElementById('profComentario').value = '';
    document.querySelectorAll('input[name="profPolo"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="profTurno"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="profModulo"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="profTipoAvaliacao"]').forEach(r => r.checked = false);

    selectAluno.value = "";
    selectAluno.focus();

  } catch (error) {
    console.error("Erro no envio:", error);
    const errorMsg = error.text || error.message || "Erro de conexão/parâmetros";
    teacherMsg.className = "message error";
    teacherMsg.innerText = "Erro ao processar envio: " + errorMsg;
  }
});

// Alterna exibição do filtro de polo
const tipoImpressaoSelect = document.getElementById('tipoImpressao');
tipoImpressaoSelect.addEventListener('change', () => {
  const tipo = tipoImpressaoSelect.value;
  document.getElementById('grupoSelectPolo').style.display = (tipo === 'polo') ? 'block' : 'none';
});

// Imprimir Aluno Selecionado
document.getElementById('btnImprimirSelecionado').addEventListener('click', () => {
  const idSelecionado = document.getElementById('selectAluno').value;
  const aluno = listaAtividades.find(a => a.id === idSelecionado);

  if (!aluno) {
    alert("Selecione um aluno na consulta para imprimir sua ficha.");
    return;
  }

  const printArea = document.getElementById('printArea');
  
  let html = `
    <div class="print-page">
      <h2>Ficha de Avaliação Acadêmica</h2>
      <p><strong>Nome do Aluno:</strong> ${aluno.nomeAluno || 'Não informado'}</p>
      <p><strong>E-mail:</strong> ${aluno.emailAluno || 'Não informado'}</p>
      <p><strong>Polo:</strong> ${aluno.polo || 'Não informado'}</p>
      <p><strong>Turno:</strong> ${aluno.turno || 'Não informado'}</p>
      <p><strong>Módulo:</strong> ${aluno.modulo || 'Não informado'}</p>
      <p><strong>Tipo de Avaliação:</strong> ${aluno.tipoAvaliacao || 'Atividade'}</p>
      <p><strong>Título do Trabalho:</strong> ${aluno.tituloTrabalho || 'Não informado'}</p>
      <p><strong>Observação / Descrição:</strong> ${aluno.descricao || 'Sem descrição'}</p>
      <p><strong>Link do Trabalho:</strong> ${aluno.urlTrabalho || 'Sem link'}</p>
      <p><strong>Arquivo Anexado:</strong> ${aluno.nomeArquivoOriginal ? `<a href="${aluno.arquivoUrl}" target="_blank">${aluno.nomeArquivoOriginal}</a>` : 'Nenhum arquivo'}</p>
      <p><strong>Nota Atribuída:</strong> ${aluno.nota !== undefined && aluno.nota !== '' ? aluno.nota : 'Não avaliado'}</p>
      <p><strong>Comentários / Feedback:</strong> ${aluno.comentario || 'Sem comentários'}</p>
    </div>
  `;

  printArea.innerHTML = html;

  setTimeout(() => {
    window.print();
  }, 300);
});

// Imprimir Relatório Geral
document.getElementById('btnImprimirGeral').addEventListener('click', async () => {
  const tipo = document.getElementById('tipoImpressao').value;
  const printArea = document.getElementById('printArea');
  printArea.innerHTML = "<p>Carregando dados para impressão...</p>";

  try {
    let q = collection(db, "atividade");
    if (tipo === 'polo') {
      const poloSelecionado = document.getElementById('selectPoloFiltro').value;
      q = query(collection(db, "atividade"), where("polo", "==", poloSelecionado));
    }

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      alert("Nenhuma atividade encontrada para esse critério.");
      printArea.innerHTML = "";
      return;
    }

    let html = '';

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      html += `
        <div class="print-page">
          <h2>Relatório de Entrega Acadêmica</h2>
          <p><strong>Nome do Aluno:</strong> ${data.nomeAluno || 'Não informado'}</p>
          <p><strong>E-mail:</strong> ${data.emailAluno || 'Não informado'}</p>
          <p><strong>Polo:</strong> ${data.polo || 'Não informado'}</p>
          <p><strong>Turno:</strong> ${data.turno || 'Não informado'}</p>
          <p><strong>Módulo:</strong> ${data.modulo || 'Não informado'}</p>
          <p><strong>Tipo de Avaliação:</strong> ${data.tipoAvaliacao || 'Atividade'}</p>
          <p><strong>Título do Trabalho:</stroneditorg> ${data.tituloTrabalho || 'Não informado'}</p>
          <p><strong>Observação / Descrição:</strong> ${data.descricao || 'Sem descrição'}</p>
          <p><strong>Link do Trabalho:</strong> ${data.urlTrabalho || 'Sem link'}</p>
          <p><strong>Arquivo Anexado:</strong> ${data.nomeArquivoOriginal ? `<a href="${data.arquivoUrl}" target="_blank">${data.nomeArquivoOriginal}</a>` : 'Nenhum arquivo'}</p>
          <p><strong>Nota Atribuída:</strong> ${data.nota !== undefined && data.nota !== '' ? data.nota : 'Não avaliado'}</p>
          <p><strong>Comentários / Feedback:</strong> ${data.comentario || 'Sem comentários'}</p>
        </div>
      `;
    });

    printArea.innerHTML = html;

    setTimeout(() => {
      window.print();
    }, 500);

  } catch (error) {
    alert("Erro ao gerar relatório: " + error.message);
    printArea.innerHTML = "";
  }
});