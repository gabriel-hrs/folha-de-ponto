// Se o SEU firebase-config.js reexporta tudo (recomendado), use esta linha:
import { db, auth, authReady, GoogleAuthProvider, signInWithPopup, linkWithPopup, signOut } from "./firebase-config.js";

// Se NÃO reexporta (e só exporta db/auth/authReady), então troque a linha acima por:
// import { db, auth, authReady } from "./firebase-config.js";
// import { GoogleAuthProvider, signInWithPopup, linkWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  doc, getDoc, setDoc, collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";


/* =======================
   UI: Status + Login/Logout
   ======================= */
// function atualizarStatusUser() {
//   const u = auth.currentUser;
//   const el = document.getElementById('status-user');
//   if (!el) return;
//   if (!u) { el.textContent = 'Deslogado'; return; }
//   el.textContent = u.isAnonymous ? `Convidado (anônimo)` : `Logado: ${u.email || u.displayName || u.uid}`;
// }
function atualizarStatusUser() {
  const u = auth.currentUser;

  // Chip do topo
  const icon = document.getElementById('user-icon');
  const label = document.getElementById('user-label');

  if (!u) {
    if (icon) icon.className = 'bi bi-person fs-5';
    if (label) label.textContent = 'Carregando...';
    return;
  }

  if (u.isAnonymous) {
    if (icon) icon.className = 'bi bi-person fs-5';
    if (label) label.textContent = 'Convidado';
  } else {
    if (icon) icon.className = 'bi bi-person-check fs-5';
    if (label) label.textContent = u.displayName || u.email || 'Conta';
  }

  atualizarUIConta(u);
}

function atualizarUIConta(u) {
  // Elementos do modal
  const mIcon   = document.getElementById('modal-user-icon');
  const mName   = document.getElementById('modal-user-name');
  const mEmail  = document.getElementById('modal-user-email');
  const boxLog  = document.getElementById('actions-logged');
  const boxAnon = document.getElementById('actions-anon');

  if (!u) {
    if (mIcon)  mIcon.className = 'bi bi-person fs-2';
    if (mName)  mName.textContent = 'Carregando...';
    if (mEmail) mEmail.textContent = '';
    if (boxLog)  boxLog.classList.add('d-none');
    if (boxAnon) boxAnon.classList.add('d-none');
    return;
  }

  if (u.isAnonymous) {
    if (mIcon)  mIcon.className = 'bi bi-person fs-2';
    if (mName)  mName.textContent = 'Convidado (anônimo)';
    if (mEmail) mEmail.textContent = 'Entre para sincronizar seus pontos';
    if (boxLog)  boxLog.classList.add('d-none');
    if (boxAnon) boxAnon.classList.remove('d-none');
  } else {
    if (mIcon)  mIcon.className = 'bi bi-person-check fs-2';
    if (mName)  mName.textContent = u.displayName || 'Usuário';
    if (mEmail) mEmail.textContent = u.email || '';
    if (boxAnon) boxAnon.classList.add('d-none');
    if (boxLog)  boxLog.classList.remove('d-none');
  }
}

async function entrarComGoogle() {
  const provider = new GoogleAuthProvider();
  const u = auth.currentUser;

  try {
    if (u && u.isAnonymous) {
      // 🔗 mantém o MESMO uid (promove anônimo)
      await linkWithPopup(u, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
    atualizarStatusUser();
    // re-carrega tabela se estiver na página de listagem
    carregarDados();
  } catch (e) {
    if (e.code === 'auth/credential-already-in-use') {
      // já existe usuário com essa conta → faz signIn
      await signInWithPopup(auth, provider);
      atualizarStatusUser();
      carregarDados();
    } else {
      console.error('Erro no Google auth:', e);
      alert('Não foi possível entrar com Google.');
    }
  }
}

async function sair() {
  await signOut(auth);
  atualizarStatusUser();
  // limpa tabela se houver
  const tabela = document.getElementById("tabela-dados");
  if (tabela) tabela.innerHTML = "";
}

/* =======================
   Util: Datas/IDs
   ======================= */
function normalizarDia(diaStr) {
  if (!diaStr) return "";
  const [d, m, a] = diaStr.split("/").map(s => s.trim());
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${dd}/${mm}/${a}`;
}

// Lê #dia como type="date" (YYYY-MM-DD) ou dd/mm/yyyy e retorna dd/mm/yyyy
function lerDiaNormalizado() {
  const el = document.getElementById("dia");
  if (!el) return "";
  const v = el.value?.trim();
  if (!v) return "";
  if (el.type === "date" || /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [yyyy, mm, dd] = v.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }
  return normalizarDia(v);
}

// Define hoje em input[type=date]
(function setHojeNoDate() {
  const el = document.getElementById("dia");
  if (!el || el.type !== "date") return;
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth()+1).padStart(2,"0");
  const dd = String(hoje.getDate()).padStart(2,"0");
  el.value = `${yyyy}-${mm}-${dd}`;
})();

// ID seguro YYYY-MM-DD (sem "/")
function docIdFromDia(diaDDMMYYYY) {
  const [dd, mm, yyyy] = diaDDMMYYYY.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

/* =======================
   Fluxo: ENTRADA
   ======================= */
async function salvarEntrada() {
  const user = auth.currentUser;
  if (!user) { alert("Autenticando... tente novamente."); return; }

  const dia = lerDiaNormalizado();
  const entrada = document.getElementById("entrada")?.value?.trim();
  if (!dia)    { alert("Selecione o dia!"); return; }
  if (!entrada){ alert("Informe o horário de entrada!"); return; }

  const docId = docIdFromDia(dia);
  const docRef = doc(db, "pontos", docId);

  const payload = { ownerUid: user.uid, dia, entrada };
  console.log("Salvar ENTRADA payload:", payload);

  await setDoc(docRef, payload, { merge: true });

  // saída prevista + 9h22
  let [h, m] = entrada.split(":").map(Number);
  m += 22; h += 9 + Math.floor(m / 60); m = m % 60;
  const saidaPrev = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;

  alert(`Seu horário de saída será às ${saidaPrev}`);

  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("Aviso de saída", {
        body: `Seu horário de saída é às ${saidaPrev}`,
        icon: "icon-192x192.png"
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }

  carregarDados();
}

/* =======================
   Fluxo: SAÍDA
   ======================= */
async function salvarSaida() {
  const user = auth.currentUser;
  if (!user) { alert("Autenticando... tente novamente."); return; }

  const dia = lerDiaNormalizado();
  const saida = document.getElementById("saida")?.value?.trim();
  if (!dia)   { alert("Selecione o dia!"); return; }
  if (!saida) { alert("Informe o horário de saída!"); return; }

  const docId = docIdFromDia(dia);
  const docRef = doc(db, "pontos", docId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    alert("Ainda não há ENTRADA registrada para este dia. Salve a entrada primeiro.");
    return;
  }
  const dados = snap.data();
  if (dados.ownerUid !== user.uid) {
    alert("Você não tem permissão para alterar este registro.");
    return;
  }

  const novos = { ...dados, saida };

  // calcula horas/saldo se houver entrada
  if (novos.entrada) {
    const [h1, m1] = novos.entrada.split(":").map(Number);
    const [h2, m2] = saida.split(":").map(Number);
    const worked = h2*60 + m2 - (h1*60 + m1);
    const expected = 9*60 + 22;
    const diff = worked - expected;

    const wh = Math.max(0, Math.floor(worked/60));
    const wm = Math.max(0, worked % 60);
    novos.horas = `${String(wh).padStart(2,"0")}:${String(wm).padStart(2,"0")}`;

    const dh = Math.floor(Math.abs(diff)/60);
    const dm = Math.abs(diff) % 60;
    novos.resultado = `${diff < 0 ? "-" : "+"}${String(dh).padStart(2,"0")}:${String(dm).padStart(2,"0")}`;

    mostrarResultadoDoDia(novos.horas, novos.resultado);
  }

  novos.ownerUid = user.uid;
  novos.dia = dia;

  console.log("Salvar SAÍDA payload:", novos);
  await setDoc(docRef, novos, { merge: true });

  carregarDados();
}

/* =======================
   UI: Resumo do dia
   ======================= */
function mostrarResultadoDoDia(horas, resultado) {
  const msg = `
    <div class="alert alert-info mt-3" role="alert">
      <strong>Resumo do dia:</strong><br>
      Horas trabalhadas: ${horas}<br>
      Saldo: ${resultado.startsWith("+") ? "🟢 " : "🔴 "}${resultado}
    </div>`;
  const container = document.querySelector(".container");
  if (!container) return;
  container.querySelector(".alert")?.remove();
  container.insertAdjacentHTML("beforeend", msg);
}

/* =======================
   Listagem (somente do usuário atual)
   ======================= */
async function carregarDados() {
  const tabela = document.getElementById("tabela-dados");
  if (!tabela) return;
  tabela.innerHTML = "";

  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "pontos"), where("ownerUid","==", user.uid));
  const snap = await getDocs(q);
  const registros = [];
  snap.forEach(d => registros.push(d.data()));

  // ordena por data (dd/mm/yyyy → Date)
  registros.sort((a,b) => {
    const [da,ma,aa] = a.dia.split("/").map(Number);
    const [db,mb,ab] = b.dia.split("/").map(Number);
    return new Date(aa,ma-1,da) - new Date(ab,mb-1,db);
  });

  registros.forEach(item => {
    const row = tabela.insertRow();
    row.insertCell(0).textContent = item.dia || "—";
    row.insertCell(1).textContent = item.entrada || "—";
    row.insertCell(2).textContent = item.saida || "—";
    row.insertCell(3).textContent = item.horas || "—";
    row.insertCell(4).textContent = item.resultado || "—";
  });
}

/* =======================
   Eventos
   ======================= */
authReady.then(() => {
  atualizarStatusUser();
  document.getElementById("btn-login-google")?.addEventListener("click", entrarComGoogle);
  document.getElementById("btn-sair")?.addEventListener("click", sair);

  document.getElementById("btn-resultado-entrada")?.addEventListener("click", salvarEntrada);
  document.getElementById("btn-resultado-saida")?.addEventListener("click", salvarSaida);

  carregarDados();
});
