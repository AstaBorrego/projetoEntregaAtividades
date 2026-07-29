import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

(function() {
  emailjs.init("Q8SiVr5mU4QBiKIK8");
})();

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
let idAtividadeAtiva = null;

const frasesIncentivo = [
  "Parabéns, {NOME}! Seu empenho e dedicação são o caminho para o seu sucesso profissional. Continue assim!",
  "Excelente trabalho, {NOME}! Cada atividade entregue é um passo importante rumo ao seu grande futuro.",
  "Muito obrigado pela entrega, {NOME}! Seu compromisso com os estudos é admirável e faz toda a diferença.",
  "Atividade recebida com sucesso, {NOME}! Continue acreditando no seu potencial e superando desafios!",
  "Parabéns pelo empenho, {NOME}! O conhecimento que você está construindo hoje abrirá portas incríveis amanhã."
];

window.showScreen = function(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  
  document.querySelectorAll('.message').forEach(m => {
    m.className = 'message';
    m.innerText = '';
  });
};

window.fecharModalSucesso = function() {
  const modal = document.getElementById('modalSucesso');
  modal.classList.remove('active');
};

// Envio do formulário do Aluno
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
  const diasAula = document.querySelector('input[name="diasAula"]:checked')?.value;
  const turno = document.querySelector('input[name="turno"]:checked')?.value;
  const modulo = document.querySelector('input[name="modulo"]:checked')?.value;
  const tipoAvaliacao = document.querySelector('input[name="tipoAvaliacao"]:checked')?.value;
  const tituloTrabalho = tituloInput.value.trim();
  const descricao = descricaoInput.value.trim();
  let urlTrabalho = urlInput.value.trim();
  const arquivo = fileInput.files[0];

  // Adiciona protocolo se o aluno digitou o link sem http/https
  if (urlTrabalho && !/^https?:\/\//i.test(urlTrabalho)) {
    urlTrabalho = 'https://' + urlTrabalho;
  }

  const camposValidacao = [
    { valor: nomeAluno, elem: nomeInput, grupoId: 'group-nomeAluno', msg: 'Por favor, preencha o Nome do Aluno.' },
    { valor: emailAluno, elem: emailInput, grupoId: 'group-emailAluno', msg: 'Por favor, informe o seu E-mail.' },
    { valor: polo, elem: null, grupoId: 'group-polo', msg: 'Por favor, selecione um Polo.' },
    { valor: diasAula, elem: null, grupoId: 'group-diasAula', msg: 'Por favor, selecione os Dias de Aula.' },
    { valor: turno, elem: null, grupoId: 'group-turno', msg: 'Por favor, selecione um Turno.' },
    { valor: modulo, elem: null, grupoId: 'group-modulo', msg: 'Por favor, selecione um Módulo.' },
    { valor: tipoAvaliacao, elem: null, grupoId: 'group-tipoAvaliacao', msg: 'Por favor, selecione o Tipo de Avaliação.' },
    { valor: tituloTrabalho, elem: tituloInput, grupoId: 'group-tituloTrabalho', msg: 'Por favor, preencha o Título do Trabalho.' },
    { valor: descricao, elem: descricaoInput, grupoId: 'group-descricao', msg: 'Por favor, insira a Observação / Descrição da Atividade.' },
    { valor: urlTrabalho, elem: urlInput, grupoId: 'group-urlTrabalho', msg: 'Por favor, insira o Link do Trabalho.' }
  ];

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

    if (arquivo) {
      const timestamp = Date.now();
      const storageRef = ref(storage, `entregas/${timestamp}_${arquivo.name}`);
      const uploadResult = await uploadBytes(storageRef, arquivo);
      arquivoUrl = await getDownloadURL(uploadResult.ref);
      nomeArquivoOriginal = arquivo.name;
    }

    await addDoc(collection(db, "atividade"), {
      nomeAluno,
      emailAluno,
      polo,
      diasAula,
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

    msgDiv.className = "message";
    msgDiv.innerText = "";
    document.getElementById('studentForm').reset();

    const fraseSorteada = frasesIncentivo[Math.floor(Math.random() * frasesIncentivo.length)];
    const mensagemFinal = fraseSorteada.replace("{NOME}", nomeAluno);

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

// Carregar lista de alunos no Select de forma única (Sem duplicados)
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

    const alunosMap = new Map();
    listaAtividades.forEach(item => {
      const chave = (item.emailAluno || item.nomeAluno || '').toLowerCase().trim();
      if (chave && !alunosMap.has(chave)) {
        alunosMap.set(chave, item.nomeAluno || 'Aluno sem nome');
      }
    });

    const alunosOrdenados = Array.from(alunosMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));

    alunosOrdenados.forEach(([chave, nome]) => {
      const opt = document.createElement('option');
      opt.value = chave;
      opt.textContent = nome;
      selectAluno.appendChild(opt);
    });
  } catch (error) {
    alert("Erro ao carregar lista de alunos: " + error.message);
  }
}

// Ao selecionar o Aluno: Mostra todos os trabalhos dele em cards
document.getElementById('selectAluno').addEventListener('change', (e) => {
  const chaveSelecionada = e.target.value;
  const areaTrabalhos = document.getElementById('areaTrabalhosAluno');
  const listaContainer = document.getElementById('listaTrabalhosAluno');

  limparFormularioProfessor();

  if (!chaveSelecionada) {
    areaTrabalhos.style.display = 'none';
    listaContainer.innerHTML = '';
    return;
  }

  const trabalhosDoAluno = listaAtividades.filter(a => 
    (a.emailAluno || a.nomeAluno || '').toLowerCase().trim() === chaveSelecionada
  );

  if (trabalhosDoAluno.length === 0) {
    areaTrabalhos.style.display = 'none';
    listaContainer.innerHTML = '';
    return;
  }

  areaTrabalhos.style.display = 'block';
  listaContainer.innerHTML = '';

  trabalhosDoAluno.forEach((trabalho) => {
    const card = document.createElement('div');
    card.className = 'card-trabalho';
    card.dataset.id = trabalho.id;

    const statusNota = trabalho.nota ? `Nota: ${trabalho.nota}` : 'Pendente de avaliação';

    card.innerHTML = `
      <h4>${trabalho.tituloTrabalho || 'Sem título'}</h4>
      <p><strong>Módulo:</strong> ${trabalho.modulo || '-'} | <strong>Tipo:</strong> ${trabalho.tipoAvaliacao || 'Atividade'}</p>
      <span class="badge-nota">${statusNota}</span>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.card-trabalho').forEach(c => c.classList.remove('ativo'));
      card.classList.add('ativo');
      carregarAtividadeFormulario(trabalho);
    });

    listaContainer.appendChild(card);
  });

  const primeiroCard = listaContainer.querySelector('.card-trabalho');
  if (primeiroCard) {
    primeiroCard.click();
  }
});

// Preenche os campos do formulário ao clicar em um trabalho
async function carregarAtividadeFormulario(alunoObj) {
  idAtividadeAtiva = alunoObj.id;

  const btnBaixarArquivo = document.getElementById('btnBaixarArquivo');
  const profNomeArquivo = document.getElementById('profNomeArquivo');

  document.getElementById('profEmailAluno').value = alunoObj.emailAluno || '';
  document.querySelectorAll('input[name="profPolo"]').forEach(r => r.checked = (r.value === alunoObj.polo));
  document.querySelectorAll('input[name="profDiasAula"]').forEach(r => r.checked = (r.value === alunoObj.diasAula));
  document.querySelectorAll('input[name="profTurno"]').forEach(r => r.checked = (r.value === alunoObj.turno));
  document.querySelectorAll('input[name="profModulo"]').forEach(r => r.checked = (r.value === alunoObj.modulo));

  const tipo = alunoObj.tipoAvaliacao || 'Atividade';
  document.querySelectorAll('input[name="profTipoAvaliacao"]').forEach(r => r.checked = (r.value === tipo));

  document.getElementById('profTituloTrabalho').value = alunoObj.tituloTrabalho || '';
  document.getElementById('profDescricao').value = alunoObj.descricao || '';
  document.getElementById('profUrlTrabalho').value = alunoObj.urlTrabalho || '';
  document.getElementById('profNota').value = alunoObj.nota !== undefined ? alunoObj.nota : '';
  document.getElementById('profComentario').value = alunoObj.comentario !== undefined ? alunoObj.comentario : '';

  if (alunoObj.arquivoUrl) {
    profNomeArquivo.value = alunoObj.nomeArquivoOriginal || "Arquivo anexado";
    btnBaixarArquivo.style.display = 'inline-block';
    btnBaixarArquivo.onclick = () => window.open(alunoObj.arquivoUrl, '_blank');
  } else {
    profNomeArquivo.value = "Nenhum arquivo anexado";
    btnBaixarArquivo.style.display = 'none';
    btnBaixarArquivo.onclick = null;
  }

  // Executa a IA para inspecionar e atribuir a nota de forma silenciosa
  await window.analisarTrabalhoEAtribuirNotaIA();
}

function limparFormularioProfessor() {
  idAtividadeAtiva = null;
  document.getElementById('profEmailAluno').value = '';
  document.querySelectorAll('input[name="profPolo"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="profDiasAula"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="profTurno"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="profModulo"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="profTipoAvaliacao"]').forEach(r => r.checked = false);
  document.getElementById('profTituloTrabalho').value = '';
  document.getElementById('profDescricao').value = '';
  document.getElementById('profUrlTrabalho').value = '';
  document.getElementById('profNota').value = '';
  document.getElementById('profComentario').value = '';
  
  const profNomeArquivo = document.getElementById('profNomeArquivo');
  const btnBaixarArquivo = document.getElementById('btnBaixarArquivo');
  profNomeArquivo.value = '';
  btnBaixarArquivo.style.display = 'none';
  btnBaixarArquivo.onclick = null;
}

// Abrir Link manualmente com tratamento do protocolo HTTP/HTTPS
document.getElementById('btnAbrirLink').addEventListener('click', () => {
  let url = document.getElementById('profUrlTrabalho').value.trim();
  if (url) {
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    window.open(url, '_blank');
  } else {
    alert("Nenhum link disponível.");
  }
});

// Salvar alterações da nota, enviar e-mail, limpar campos e posicionar no topo
document.getElementById('btnSalvarNota').addEventListener('click', async () => {
  const teacherMsg = document.getElementById('teacherMsg');

  if (!idAtividadeAtiva) {
    teacherMsg.className = "message error";
    teacherMsg.innerText = "Por favor, selecione um trabalho para salvar as alterações.";
    return;
  }

  const emailAluno = document.getElementById('profEmailAluno').value.trim();
  const polo = document.querySelector('input[name="profPolo"]:checked')?.value || '';
  const diasAula = document.querySelector('input[name="profDiasAula"]:checked')?.value || '';
  const turno = document.querySelector('input[name="profTurno"]:checked')?.value || '';
  const modulo = document.querySelector('input[name="profModulo"]:checked')?.value || '';
  const tipoAvaliacao = document.querySelector('input[name="profTipoAvaliacao"]:checked')?.value || 'Atividade';
  const tituloTrabalho = document.getElementById('profTituloTrabalho').value.trim();
  const descricao = document.getElementById('profDescricao').value.trim();
  const urlTrabalho = document.getElementById('profUrlTrabalho').value.trim();
  const nota = document.getElementById('profNota').value;
  const comentario = document.getElementById('profComentario').value;

  try {
    const docRef = doc(db, "atividade", idAtividadeAtiva);
    
    await updateDoc(docRef, { 
      emailAluno,
      polo,
      diasAula,
      turno,
      modulo,
      tipoAvaliacao,
      tituloTrabalho,
      descricao,
      urlTrabalho,
      nota,
      comentario
    });

    const trabalhoLocal = listaAtividades.find(a => a.id === idAtividadeAtiva);
    if (trabalhoLocal) {
      trabalhoLocal.emailAluno = emailAluno;
      trabalhoLocal.polo = polo;
      trabalhoLocal.diasAula = diasAula;
      trabalhoLocal.turno = turno;
      trabalhoLocal.modulo = modulo;
      trabalhoLocal.tipoAvaliacao = tipoAvaliacao;
      trabalhoLocal.tituloTrabalho = tituloTrabalho;
      trabalhoLocal.descricao = descricao;
      trabalhoLocal.urlTrabalho = urlTrabalho;
      trabalhoLocal.nota = nota;
      trabalhoLocal.comentario = comentario;
    }

    if (emailAluno) {
      emailjs.init("Q8SiVr5mU4QBiKIK8");

      const templateParams = {
        to_email: emailAluno,
        name: trabalhoLocal?.nomeAluno || '',
        title: tituloTrabalho || 'Avaliação de Atividade',
        modulo: modulo || '',
        nota: nota,
        comentario: comentario || 'Sem comentários adicionais.'
      };

      await emailjs.send('service_2m6uvjh', 'template_bgkfhap', templateParams);
    }

    // 1. Limpa o formulário e reseta a lista de seleção
    limparFormularioProfessor();
    const selectAluno = document.getElementById('selectAluno');
    selectAluno.value = "";
    
    const areaTrabalhos = document.getElementById('areaTrabalhosAluno');
    const listaContainer = document.getElementById('listaTrabalhosAluno');
    areaTrabalhos.style.display = 'none';
    listaContainer.innerHTML = '';

    // 2. Exibe mensagem de sucesso
    teacherMsg.className = "message success";
    teacherMsg.innerText = "Alterações salvas e e-mail enviado com sucesso!";

    // 3. Posiciona a tela no topo para escolha de outro aluno
    window.scrollTo({ top: 0, behavior: 'smooth' });
    selectAluno.focus();

  } catch (error) {
    console.error("Erro no salvamento:", error);
    const errorMsg = error.text || error.message || "Erro de conexão/parâmetros";
    teacherMsg.className = "message error";
    teacherMsg.innerText = "Erro ao processar alterações: " + errorMsg;
  }
});

const tipoImpressaoSelect = document.getElementById('tipoImpressao');
tipoImpressaoSelect.addEventListener('change', () => {
  const tipo = tipoImpressaoSelect.value;
  document.getElementById('grupoSelectPolo').style.display = (tipo === 'polo') ? 'block' : 'none';
});

// Imprimir Aluno Selecionado
document.getElementById('btnImprimirSelecionado').addEventListener('click', () => {
  if (!idAtividadeAtiva) {
    alert("Selecione um trabalho na consulta para imprimir sua ficha.");
    return;
  }

  const aluno = listaAtividades.find(a => a.id === idAtividadeAtiva);
  if (!aluno) return;

  const printArea = document.getElementById('printArea');
  
  let html = `
    <div class="print-page">
      <h2>Ficha de Avaliação Acadêmica</h2>
      <p><strong>Nome do Aluno:</strong> ${aluno.nomeAluno || 'Não informado'}</p>
      <p><strong>E-mail:</strong> ${aluno.emailAluno || 'Não informado'}</p>
      <p><strong>Polo:</strong> ${aluno.polo || 'Não informado'}</p>
      <p><strong>Dias de Aula:</strong> ${aluno.diasAula || 'Não informado'}</p>
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
          <p><strong>Dias de Aula:</strong> ${data.diasAula || 'Não informado'}</p>
          <p><strong>Turno:</strong> ${data.turno || 'Não informado'}</p>
          <p><strong>Módulo:</strong> ${data.modulo || 'Não informado'}</p>
          <p><strong>Tipo de Avaliação:</strong> ${data.tipoAvaliacao || 'Atividade'}</p>
          <p><strong>Título do Trabalho:</strong> ${data.tituloTrabalho || 'Não informado'}</p>
          <p><strong>Observação / Descrição:</strong> ${data.descricao || 'Sem descrição'}</p>
          <p><strong>Link do Trabalho:</strong> ${data.urlTrabalho || 'Sem link'}</p>
          <p><strong>Arquivo Anexado:</strong> ${data.nomeArquivoOriginal ? `<a href="${data.arquivoUrl}" target="_blank">${data.arquivoUrl}</a>` : 'Nenhum arquivo'}</p>
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

// AVALIAÇÃO AUTOMÁTICA DA IA (Tratamento para GitHub / GitHub Pages / Sites gerais)
window.analisarTrabalhoEAtribuirNotaIA = async function() {
  const campoNota = document.getElementById('profNota');
  const campoComentario = document.getElementById('profComentario');

  const selectAluno = document.getElementById('selectAluno');
  if (!selectAluno || !selectAluno.value) return;

  const nomeAluno = selectAluno.options[selectAluno.selectedIndex]?.text || "Aluno";
  let urlTrabalho = document.getElementById('profUrlTrabalho').value.trim();

  // Se já houver nota diferente de vazia ou padrão
  if (campoNota.value && campoNota.value !== "7.0") return;

  if (!urlTrabalho) {
    campoNota.value = "7.0";
    campoComentario.value = `Atenção: Nenhum link foi fornecido por ${nomeAluno}.`;
    return;
  }

  // Formata a URL garantindo o protocolo
  if (!/^https?:\/\//i.test(urlTrabalho)) {
    urlTrabalho = 'https://' + urlTrabalho;
    document.getElementById('profUrlTrabalho').value = urlTrabalho;
  }

  campoComentario.value = "🤖 Conectando e analisando o projeto do aluno no GitHub/Web...";

  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlTrabalho)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error("Não foi possível conectar ao servidor remoto.");
    }

    const data = await response.json();
    const htmlContent = data.contents;

    if (!htmlContent || htmlContent.length < 30) {
      campoNota.value = "7.0";
      campoComentario.value = `O link retornado para ${nomeAluno} está inacessível ou vazio.`;
      return;
    }

    let notaBase = 7.0;
    let observacoes = [];

    // Verificação específica se for um repositório GitHub tradicional
    const isGitHubRepo = urlTrabalho.includes('github.com') && !urlTrabalho.includes('github.io');

    if (isGitHubRepo) {
      observacoes.push("Repositório GitHub identificado");
      notaBase += 1.0;

      if (htmlContent.includes('README') || htmlContent.includes('readme')) {
        notaBase += 1.0;
        observacoes.push("Documentação README presente");
      }
      
      if (htmlContent.includes('index.html') || htmlContent.includes('.js') || htmlContent.includes('.css')) {
        notaBase += 1.0;
        observacoes.push("Arquivos de código-fonte estruturados");
      }
    } else {
      // Verificação para sites publicados (GitHub Pages, Vercel, Netlify, etc.)
      const parser = new DOMParser();
      const docHtml = parser.parseFromString(htmlContent, 'text/html');

      const temHeader = docHtml.querySelector('header, nav, main, section, article, div') ? true : false;
      if (temHeader) {
        notaBase += 1.0;
        observacoes.push("Estrutura HTML verificada");
      }

      const scripts = docHtml.querySelectorAll('script').length;
      const linksCss = docHtml.querySelectorAll('link[rel="stylesheet"], style').length;

      if (linksCss > 0 || htmlContent.includes('style')) {
        notaBase += 1.0;
        observacoes.push("Estilização CSS identificada");
      }
      if (scripts > 0 || htmlContent.includes('script')) {
        notaBase += 1.0;
        observacoes.push("Interatividade JS/Scripts presentes");
      }
    }

    let notaFinal = Math.min(10.0, Math.max(7.0, notaBase)).toFixed(1);

    let parecer = `Análise do projeto de ${nomeAluno}:\n`;
    parecer += `- Link verificado: ${urlTrabalho}\n`;
    parecer += `- Pontos observados: ${observacoes.join(', ')}.\n`;
    parecer += `Nota sugerida: ${notaFinal}.`;

    campoNota.value = notaFinal;
    campoComentario.value = parecer;

  } catch (error) {
    console.error("Erro na inspeção do link:", error);
    campoNota.value = "7.0";
    campoComentario.value = `Aviso: O link "${urlTrabalho}" requer validação manual pelo professor. Nota base (7.0) atribuída preventivamente.`;
  }
};