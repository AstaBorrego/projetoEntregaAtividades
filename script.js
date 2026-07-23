import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAjwv9_na1rBCKXDR4VnwrggUYxz976Pfc",
  authDomain: "projetoatividade-4d976.firebaseapp.com",
  projectId: "projetoatividade-4d976",
  storageBucket: "projetoatividade-4d976.firebasestorage.app",
  messagingSenderId: "834912903495",
  appId: "1:834912903495:web:574e7d47340777e7296c62",
  measurementId: "G-1HJQS7S0RE"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Função global para alternar telas
window.showScreen = function(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  
  // Limpa mensagens
  document.querySelectorAll('.message').forEach(m => {
    m.className = 'message';
    m.innerText = '';
  });
};

// Manipulador do formulário do Aluno (Coleção 'atividade')
document.getElementById('studentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgDiv = document.getElementById('studentMsg');
  
  const nomeAluno = document.getElementById('nomeAluno').value.trim();
  const polo = document.querySelector('input[name="polo"]:checked')?.value;
  const turno = document.querySelector('input[name="turno"]:checked')?.value;
  const modulo = document.querySelector('input[name="modulo"]:checked')?.value;
  const descricao = document.getElementById('descricao').value.trim();
  const urlTrabalho = document.getElementById('urlTrabalho').value.trim();

  // Validação personalizada de preenchimento de todos os campos obrigatórios
  if (!nomeAluno || !polo || !turno || !modulo || !descricao || !urlTrabalho) {
    msgDiv.className = "message error";
    msgDiv.innerText = "Todos os campos devem ser preenchidos";
    return;
  }

  try {
    await addDoc(collection(db, "atividade"), {
      nomeAluno,
      polo,
      turno,
      modulo,
      descricao,
      urlTrabalho,
      dataEnvio: new Date()
    });

    msgDiv.className = "message success";
    msgDiv.innerText = "Atividade enviada com sucesso!";
    document.getElementById('studentForm').reset();
  } catch (error) {
    msgDiv.className = "message error";
    msgDiv.innerText = "Erro ao enviar atividade: " + error.message;
  }
});

// Login do Professor (Autenticação Firebase)
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
  } catch (error) {
    msgDiv.className = "message error";
    msgDiv.innerText = "Usuário/Senha inválidos ou não cadastrados.";
  }
});

// Controla visibilidade do select de Polo
const tipoImpressaoSelect = document.getElementById('tipoImpressao');
tipoImpressaoSelect.addEventListener('change', () => {
  const tipo = tipoImpressaoSelect.value;
  document.getElementById('grupoSelectPolo').style.display = (tipo === 'polo') ? 'block' : 'none';
});

// Gera o relatório e abre a caixa de impressão
document.getElementById('btnImprimir').addEventListener('click', async () => {
  const tipo = document.getElementById('tipoImpressao').value;
  const printArea = document.getElementById('printArea');
  printArea.innerHTML = "<p>Carregando dados...</p>";

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

    let html = `<h2>Relatório de Entregas - ${tipo === 'polo' ? document.getElementById('selectPoloFiltro').value : 'Geral (Todos)'}</h2>`;
    html += `<table>
      <thead>
        <tr>
          <th>Aluno</th>
          <th>Polo</th>
          <th>Turno</th>
          <th>Módulo</th>
          <th>Descrição</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody>`;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      html += `
        <tr>
          <td>${data.nomeAluno || 'Não informado'}</td>
          <td>${data.polo || ''}</td>
          <td>${data.turno || ''}</td>
          <td>${data.modulo || ''}</td>
          <td>${data.descricao || ''}</td>
          <td><a href="${data.urlTrabalho}" target="_blank">Abrir Link</a></td>
        </tr>`;
    });

    html += `</tbody></table>`;
    printArea.innerHTML = html;

    // Aguarda renderização para imprimir
    setTimeout(() => {
      window.print();
    }, 500);

  } catch (error) {
    alert("Erro ao gerar relatório: " + error.message);
    printArea.innerHTML = "";
  }
});