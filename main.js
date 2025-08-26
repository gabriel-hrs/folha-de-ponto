import { db, auth, authReady } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// Normaliza dd/mm/yyyy com zeros à esquerda
function normalizarDia(diaStr) {
  if (!diaStr) return "";
  const [d, m, a] = diaStr.split("/").map(s => s.trim());
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${dd}/${mm}/${a}`;
}

// Gera um ID seguro para o doc (YYYY-MM-DD)
function docIdFromDia(diaDDMMYYYY) {
  const [dd, mm, yyyy] = diaDDMMYYYY.split("/");
  return `${yyyy}-${mm}-${dd}`; // ex.: 2025-08-25
}

// -------- salvar entrada (sem getDoc) --------
async function salvarEntrada() {
  const user = auth.currentUser;
  if (!user) { alert("Autenticando... tente novamente."); return; }

  const dia = normalizarDia(document.getElementById("dia")?.value?.trim());
  const entrada = document.getElementById("entrada")?.value?.trim();
  if (!dia)    { alert("Selecione o dia!"); return; }
  if (!entrada){ alert("Informe o horário de entrada!"); return; }

  const docId = docIdFromDia(dia);
  const docRef = doc(db, "pontos", docId);

  // grava direto; evita getDoc em documento inexistente (regras exigem ownerUid)
  const payload = { ownerUid: user.uid, dia, entrada };
  console.log("Salvar ENTRADA payload:", payload);
  await setDoc(docRef, payload, { merge: true });

  // saída prevista +9h22
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

// -------- salvar saída (lê doc existente) --------
async function salvarSaida() {
  const user = auth.currentUser;
  if (!user) { alert("Autenticando... tente novamente."); return; }

  const dia = normalizarDia(document.getElementById("dia")?.value?.trim());
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

  // mantém ownerUid/dia
  novos.ownerUid = user.uid;
  novos.dia = dia;

  console.log("Salvar SAÍDA payload:", novos);
  await setDoc(docRef, novos, { merge: true });

  carregarDados();
}

// alerta com resumo do dia
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

// listar apenas docs do usuário atual
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

// eventos só após auth pronta
authReady.then(() => {
  document.getElementById("btn-resultado-entrada")
    ?.addEventListener("click", salvarEntrada);
  document.getElementById("btn-resultado-saida")
    ?.addEventListener("click", salvarSaida);

  carregarDados();
});
