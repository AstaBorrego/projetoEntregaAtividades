import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";
//import { GoogleGenAI } from "https://esm.run/@google/genai";

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

// --- Constantes e Utilitários Globais ---
const frasesIncentivo = [
  "Parabéns, {NOME}! Seu empenho e dedicação são o caminho para o seu sucesso profissional. Continue assim!",
  "Excelente trabalho, {NOME}! Cada atividade entregue é um passo importante rumo ao seu grande futuro.",
  "Muito obrigado pela entrega, {NOME}! Seu compromisso com os estudos é admirável e faz toda a diferença.",
  "Atividade recebida com sucesso, {NOME}! Seu futuro é brilhante, e cada passo conta. Avance sempre!",
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

// --- Funções do Aluno ---
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

  if (urlTrabalho && !/^https?:\/\//i.test(urlTrabalho)) {
    urlTrabalho = 'https://' + urlTrabalho;
  }

  const validationFields = [
    { valor: nomeAluno, elem: nomeInput, grupoId: 'group-nomeAluno', msg: 'Por favor, preencha o Nome do Aluno.' },
    { valor: emailAluno, elem: emailInput, grupoId: 'group-emailAluno', msg: 'Por favor, informe o seu E-mail.' },
    { valor: polo, elem: null, grupoId: 'group-polo', msg: 'Por favor, selecione um Polo.' },
    { valor: diasAula, elem: null, grupoId: 'group-diasAula', msg: 'Por favor, selecione os Dias de Aula.' },
    { valor: turno, elem: null, grupoId: 'group-turno', msg: 'Por favor, selecione um Turno.' },
    { valor: modulo, elem: null, grupoId: 'group-modulo', msg: 'Por favor, selecione um Módulo.' },
    { valor: tipoAvaliacao, elem: null, grupoId: 'group-tipoAvaliacao', msg: 'Por favor, selecione o Tipo de Avaliação.' },
    { valor: tituloTrabalho, elem: tituloInput, grupoId: 'group-tituloTrabalho', msg: 'Por favor, preencha o Título do Trabalho.' },
    { valor: descricao && descricao.length >= 20, elem: descricaoInput, grupoId: 'group-descricao', msg: 'A descrição deve ter no mínimo 20 caracteres.' },
    { valor: urlTrabalho, elem: urlInput, grupoId: 'group-urlTrabalho', msg: 'Por favor, insira o Link do Trabalho.' }
  ];

  for (const item of validationFields) {
    if (!item.valor) {
      msgDiv.className = "message error";
      msgDiv.innerText = item.msg;
      const alvoGrupo = document.getElementById(item.grupoId);
      if (alvoGrupo) alvoGrupo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (item.elem) item.elem.focus();
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

// --- Login do Professor ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgDiv = document.getElementById('loginMsg');
  const email = document.getElementById('profEmail').value.trim();
  const password = document.getElementById('profPassword').value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showScreen('teacherDashboard');
    carregarAlunosProfessor();
  } catch (error) {
    msgDiv.className = "message error";
    msgDiv.innerText = "Usuário/Senha inválidos ou não cadastrados.";
  }
});

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
      if (chave && !alunosMap.has(chave)) alunosMap.set(chave, item.nomeAluno || 'Aluno sem nome');
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

function renderStudentActivities(chaveSelecionada) {
  const areaTrabalhos = document.getElementById('areaTrabalhosAluno');
  const listaContainer = document.getElementById('listaTrabalhosAluno');
  limparFormularioProfessor();
  
  if (!chaveSelecionada) {
    areaTrabalhos.style.display = 'none';
    listaContainer.innerHTML = '';
    return;
  }
  
  const trabalhosDoAluno = listaAtividades.filter(a => (a.emailAluno || a.nomeAluno || '').toLowerCase().trim() === chaveSelecionada);
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
    card.innerHTML = `
      <h4>${trabalho.tituloTrabalho || 'Sem título'}</h4>
      <p><strong>Módulo:</strong> ${trabalho.modulo || '-'} | <strong>Tipo:</strong> ${trabalho.tipoAvaliacao || 'Atividade'}</p>
      <span class="badge-nota">${trabalho.nota ? `Nota: ${trabalho.nota}` : 'Pendente'}</span>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('.card-trabalho').forEach(c => c.classList.remove('ativo'));
      card.classList.add('ativo');
      loadActivityIntoTeacherForm(trabalho);
    });
    listaContainer.appendChild(card);
  });
  
  const primeiroCard = listaContainer.querySelector('.card-trabalho');
  if (primeiroCard) primeiroCard.click();
}

function limparFormularioProfessor() {
  idAtividadeAtiva = null;
  document.getElementById('profEmailAluno').value = '';
  document.querySelectorAll('input[name="profPolo"]').forEach(el => el.checked = false);
  document.querySelectorAll('input[name="profDiasAula"]').forEach(el => el.checked = false);
  document.querySelectorAll('input[name="profTurno"]').forEach(el => el.checked = false);
  document.querySelectorAll('input[name="profModulo"]').forEach(el => el.checked = false);
  document.querySelectorAll('input[name="profTipoAvaliacao"]').forEach(el => el.checked = false);
  document.getElementById('profTituloTrabalho').value = '';
  document.getElementById('profDescricao').value = '';
  document.getElementById('profUrlTrabalho').value = '';
  document.getElementById('profNomeArquivo').value = '';
  document.getElementById('btnBaixarArquivo').style.display = 'none';
  document.getElementById('profNota').value = '';
  document.getElementById('profComentario').value = '';
  document.getElementById('iaStatus').innerText = '';
}

function handleTeacherStudentSelectionChange(e) {
  const chaveSelecionada = e.target.value;
  renderStudentActivities(chaveSelecionada);
}

function loadActivityIntoTeacherForm(alunoObj) {
  idAtividadeAtiva = alunoObj.id;
  const btnBaixarArquivo = document.getElementById('btnBaixarArquivo');
  const profNomeArquivo = document.getElementById('profNomeArquivo');
  
  document.getElementById('profEmailAluno').value = alunoObj.emailAluno || '';
  
  const marcarRadio = (nomeInput, valor) => {
    if (!valor) return;
    document.querySelectorAll(`input[name="${nomeInput}"]`).forEach(el => {
      el.checked = (el.value === valor);
    });
  };

  marcarRadio('profPolo', alunoObj.polo);
  marcarRadio('profDiasAula', alunoObj.diasAula);
  marcarRadio('profTurno', alunoObj.turno);
  marcarRadio('profModulo', alunoObj.modulo);
  marcarRadio('profTipoAvaliacao', alunoObj.tipoAvaliacao);

  document.getElementById('profTituloTrabalho').value = alunoObj.tituloTrabalho || '';
  document.getElementById('profDescricao').value = alunoObj.descricao || '';
  
  const urlInput = document.getElementById('profUrlTrabalho');
  urlInput.value = alunoObj.urlTrabalho || '';
  
  const btnAbrirLink = document.getElementById('btnAbrirLink');
  btnAbrirLink.onclick = () => {
    if (alunoObj.urlTrabalho) window.open(alunoObj.urlTrabalho, '_blank');
    else alert('Nenhum link cadastrado para este trabalho.');
  };

  if (alunoObj.arquivoUrl) {
    profNomeArquivo.value = alunoObj.nomeArquivoOriginal || "Arquivo anexado";
    btnBaixarArquivo.style.display = 'inline-block';
    btnBaixarArquivo.onclick = () => window.open(alunoObj.arquivoUrl, '_blank');
  } else {
    profNomeArquivo.value = "Nenhum arquivo anexado";
    btnBaixarArquivo.style.display = 'none';
  }

  document.getElementById('profNota').value = alunoObj.nota || '';
  document.getElementById('profComentario').value = alunoObj.comentario || '';
  document.getElementById('iaStatus').innerText = '';
}

// --- INTEGRAÇÃO COM IA (GOOGLE GEMINI) PARA CORREÇÃO ---
document.getElementById('btnCorrigirIA').addEventListener('click', async () => {
  const statusEl = document.getElementById('iaStatus');
  if (!idAtividadeAtiva) {
    alert("Selecione um trabalho primeiro.");
    return;
  }

  const alunoObj = listaAtividades.find(a => a.id === idAtividadeAtiva);
  if (!alunoObj) return;

  try {
    statusEl.style.color = '#3730a3';
    statusEl.innerText = "🤖 A Inteligência Artificial está analisando o trabalho...";

    // Instancia o cliente da IA (substitua a chave se necessário ou utilize a variável de ambiente)
    const ai = new GoogleGenAI({ apiKey: "AQ.Ab8RN6JhsgnZD3zEZ4XSuTYOsYNRCtFxE0KMFCFNULffjWScRQ" });

    const promptText = `
      Você é um professor sênior especialista em tecnologia e avaliação acadêmica.
      Por favor, analise a seguinte entrega acadêmica de um aluno e forneça uma nota de 7.0 a 10.0 e um feedback construtivo detalhado.
      
      Tipo de Avaliação: ${alunoObj.tipoAvaliacao || 'Atividade'}
      Título: ${alunoObj.tituloTrabalho || 'N/A'}
      Descrição/Observação enviada pelo aluno: ${alunoObj.descricao || 'N/A'}
      Link enviado: ${alunoObj.urlTrabalho || 'N/A'}
      Arquivo anexado: ${alunoObj.nomeArquivoOriginal || 'Nenhum'}

      Responda estritamente no seguinte formato JSON puro (sem markdown extra, apenas o objeto):
      {
        "nota": 9.5,
        "comentario": "Seu feedback detalhado e construtivo aqui..."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
    });

    const textResult = response.text.trim();
    // Limpeza de possíveis marcações de bloco de código do markdown
    const jsonClean = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const dadosIA = JSON.parse(jsonClean);

    if (dadosIA.nota && dadosIA.comentario) {
      // Garante que a nota esteja dentro do intervalo permitido 7.0 e 10.0
      let notaFinal = parseFloat(dadosIA.nota);
      if (notaFinal < 7) notaFinal = 7.0;
      if (notaFinal > 10) notaFinal = 10.0;

      document.getElementById('profNota').value = notaFinal.toFixed(1);
      document.getElementById('profComentario').value = dadosIA.comentario;

      statusEl.style.color = '#166534';
      statusEl.innerText = "✅ Correção e sugestão geradas com sucesso pela IA!";
    } else {
      throw new Error("Formato de resposta da IA inválido.");
    }

  } catch (error) {
    statusEl.style.color = '#991b1b';
    statusEl.innerText = "❌ Erro ao processar com IA: " + error.message;
  }
});

// --- Salvar Nota / Feedback e Enviar E-mail ---
document.getElementById('btnSalvarNota').addEventListener('click', async () => {
  const msgDiv = document.getElementById('teacherMsg');
  if (!idAtividadeAtiva) {
    alert("Selecione um trabalho na lista para salvar a avaliação.");
    return;
  }

  const notaInput = document.getElementById('profNota').value.trim();
  const comentario = document.getElementById('profComentario').value.trim();
  const notaNum = parseFloat(notaInput);

  if (isNaN(notaNum) || notaNum < 7 || notaNum > 10) {
    alert("A nota deve estar entre 7.0 e 10.0.");
    return;
  }

  try {
    msgDiv.className = "message success";
    msgDiv.innerText = "Salvando alterações e enviando e-mail...";

    const atividadeRef = doc(db, "atividade", idAtividadeAtiva);
    await updateDoc(atividadeRef, {
      nota: notaInput,
      comentario: comentario
    });

    const index = listaAtividades.findIndex(a => a.id === idAtividadeAtiva);
    if (index !== -1) {
      listaAtividades[index].nota = notaInput;
      listaAtividades[index].comentario = comentario;
    }

    const alunoAtual = listaAtividades.find(a => a.id === idAtividadeAtiva);
    if (!alunoAtual || !alunoAtual.emailAluno) {
      throw new Error("Não foi possível localizar os dados do aluno para o envio do e-mail.");
    }

    const templateParams = {
      to_email: alunoAtual.emailAluno,
      email: alunoAtual.emailAluno,
      name: alunoAtual.nomeAluno || "Aluno",
      title: `${alunoAtual.tituloTrabalho || "Atividade"} - Nota: ${notaInput} | Feedback: ${comentario || "Sem comentários adicionais."}`
    };
    
    await emailjs.send('service_2m6uvjh', 'template_ec028xn', templateParams);

    msgDiv.className = "message success";
    msgDiv.innerText = "Nota salva e e-mail enviado com sucesso!";
    
    const cardAtivoEncontrado = document.querySelector(`.card-trabalho[data-id="${idAtividadeAtiva}"]`);
    if (cardAtivoEncontrado) {
      const badge = cardAtivoEncontrado.querySelector('.badge-nota');
      if (badge) badge.innerText = `Nota: ${notaInput}`;
    }

    document.getElementById('profNota').value = "";
    document.getElementById('profComentario').value = "";
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    setTimeout(() => {
      msgDiv.innerText = "";
      msgDiv.className = "";
    }, 5000);
  } catch (error) {
    const erroTexto = error?.text || error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || "Erro desconhecido";
    msgDiv.className = "message error";
    msgDiv.innerText = "Erro ao salvar/enviar: " + erroTexto;
  }
});

// --- Funções de Impressão ---
const assinaturaHtml = `
    <div class="print-signature">
        <img src="assinaturaGov.png" alt="Assinatura Digital">
    </div>
`;

function generateSingleActivityPrintContent() {
  const aluno = listaAtividades.find(a => a.id === idAtividadeAtiva);
  if (!aluno) return '';

  return `
    <div class="print-page">
      <h2>Ficha de Avaliação Acadêmica</h2>
      <p><strong>Nome do Aluno:</strong> ${aluno.nomeAluno || 'Não informado'}</p>
      <p><strong>E-mail:</strong> ${aluno.emailAluno || 'Não informado'}</p>
      <p><strong>Polo:</strong> ${aluno.polo || 'Não informado'} | <strong>Turno:</strong> ${aluno.turno || 'Não informado'}</p>
      <p><strong>Módulo:</strong> ${aluno.modulo || 'Não informado'} | <strong>Tipo:</strong> ${aluno.tipoAvaliacao || 'Não informado'}</p>
      <p><strong>Título do Trabalho:</strong> ${aluno.tituloTrabalho || 'Não informado'}</p>
      <p><strong>Descrição:</strong> ${aluno.descricao || 'Não informada'}</p>
      <p><strong>Nota Atribuída:</strong> ${aluno.nota || 'Não avaliado'}</p>
      <p><strong>Comentários / Feedback:</strong> ${aluno.comentario || 'Sem comentários'}</p>
      ${assinaturaHtml}
    </div>
  `;
}

function handlePrintSelectedActivity() {
  const printArea = document.getElementById('printArea');
  if (!idAtividadeAtiva) {
    alert("Selecione um trabalho na consulta para imprimir sua ficha.");
    return;
  }
  printArea.innerHTML = generateSingleActivityPrintContent();
  setTimeout(() => window.print(), 300);
}

async function handlePrintGeneralReport() {
  const printArea = document.getElementById('printArea');
  printArea.innerHTML = "<p>Carregando dados para relatório geral...</p>";

  const polosSelecionados = Array.from(document.querySelectorAll('input[name="filtroPolo"]:checked')).map(cb => cb.value);
  const moduloSelecionado = document.getElementById('filtroModulo').value;
  const tipoSelecionado = document.getElementById('filtroTipo').value;

  try {
    let q = collection(db, "atividade");
    const querySnapshot = await getDocs(q);
    
    let html = '';
    let contador = 0;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      if (polosSelecionados.length > 0 && !polosSelecionados.includes(data.polo)) return;
      if (moduloSelecionado && data.modulo !== moduloSelecionado) return;
      if (tipoSelecionado && data.tipoAvaliacao !== tipoSelecionado) return;

      contador++;
      html += `
        <div class="print-page">
          <h2>Relatório de Entrega Acadêmica</h2>
          <p><strong>Nome do Aluno:</strong> ${data.nomeAluno || 'Não informado'}</p>
          <p><strong>E-mail:</strong> ${data.emailAluno || 'Não informado'}</p>
          <p><strong>Polo:</strong> ${data.polo || 'Não informado'} | <strong>Módulo:</strong> ${data.modulo || 'Não informado'}</p>
          <p><strong>Título do Trabalho:</strong> ${data.tituloTrabalho || 'Não informado'}</p>
          <p><strong>Nota Atribuída:</strong> ${data.nota || 'Não avaliado'}</p>
          <p><strong>Comentários / Feedback:</strong> ${data.comentario || 'Sem comentários'}</p>
          ${assinaturaHtml}
        </div>
      `;
    });

    if (contador === 0) {
      printArea.innerHTML = "<p>Nenhum registro encontrado com os filtros selecionados.</p>";
      return;
    }

    printArea.innerHTML = html;
    setTimeout(() => window.print(), 300);

  } catch (error) {
    printArea.innerHTML = `<p class="message error">Erro ao gerar relatório: ${error.message}</p>`;
  }
}

document.getElementById('selectAluno').addEventListener('change', handleTeacherStudentSelectionChange);
document.getElementById('btnImprimirSelecionado').addEventListener('click', handlePrintSelectedActivity);
document.getElementById('btnImprimirGeral').addEventListener('click', handlePrintGeneralReport);
