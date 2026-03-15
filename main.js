// // === IMPORTS ================================================================
// // Se o SEU firebase-config.js reexporta tudo (recomendado):
// import {
//   db, auth, authReady,
//   GoogleAuthProvider, signInWithPopup, linkWithPopup, signOut
// } from "./firebase-config.js";

// // Se NÃO reexporta (APENAS db/auth/authReady), troque o bloco acima por:
// // import { db, auth, authReady } from "./firebase-config.js";
// // import { GoogleAuthProvider, signInWithPopup, linkWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// import {
//   doc, getDoc, setDoc, collection, getDocs, query, where
// } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";


// // === UI: CHIP + MODAL DE CONTA =============================================
// function atualizarStatusUser() {
//   const u = auth.currentUser;

//   // Chip do topo
//   const icon  = document.getElementById('user-icon');
//   const label = document.getElementById('user-label');

//   if (!u) {
//     if (icon)  icon.className = 'bi bi-person fs-5';
//     if (label) label.textContent = 'Carregando...';
//     return;
//   }

//   if (u.isAnonymous) {
//     if (icon)  icon.className = 'bi bi-person fs-5';
//     if (label) label.textContent = 'Convidado';
//   } else {
//     if (icon)  icon.className = 'bi bi-person-check fs-5';
//     if (label) label.textContent = u.displayName || u.email || 'Conta';
//   }

//   atualizarUIConta(u);
// }

// function atualizarUIConta(u) {
//   // Elementos do modal
//   const mIcon   = document.getElementById('modal-user-icon');
//   const mName   = document.getElementById('modal-user-name');
//   const mEmail  = document.getElementById('modal-user-email');
//   const boxLog  = document.getElementById('actions-logged');
//   const boxAnon = document.getElementById('actions-anon');

//   if (!u) {
//     if (mIcon)  mIcon.className = 'bi bi-person fs-2';
//     if (mName)  mName.textContent = 'Carregando...';
//     if (mEmail) mEmail.textContent = '';
//     if (boxLog)  boxLog.classList.add('d-none');
//     if (boxAnon) boxAnon.classList.add('d-none');
//     return;
//   }

//   if (u.isAnonymous) {
//     if (mIcon)  mIcon.className = 'bi bi-person fs-2';
//     if (mName)  mName.textContent = 'Convidado (anônimo)';
//     if (mEmail) mEmail.textContent = 'Entre para sincronizar seus pontos';
//     if (boxLog)  boxLog.classList.add('d-none');
//     if (boxAnon) boxAnon.classList.remove('d-none');
//   } else {
//     if (mIcon)  mIcon.className = 'bi bi-person-check fs-2';
//     if (mName)  mName.textContent = u.displayName || 'Usuário';
//     if (mEmail) mEmail.textContent = u.email || '';
//     if (boxAnon) boxAnon.classList.add('d-none');
//     if (boxLog)  boxLog.classList.remove('d-none');
//   }
// }

// async function entrarComGoogle() {
//   const provider = new GoogleAuthProvider();
//   const u = auth.currentUser;

//   try {
//     if (u && u.isAnonymous) {
//       // 🔗 promove usuário anônimo (mantém o MESMO uid)
//       await linkWithPopup(u, provider);
//     } else {
//       await signInWithPopup(auth, provider);
//     }
//     atualizarStatusUser();
//     carregarDados(); // se estiver na tela de listagem
//   } catch (e) {
//     if (e.code === 'auth/credential-already-in-use') {
//       // Conta já existe → faz sign-in
//       await signInWithPopup(auth, provider);
//       atualizarStatusUser();
//       carregarDados();
//     } else {
//       console.error('Erro no Google auth:', e);
//       alert('Não foi possível entrar com Google.');
//     }
//   }
// }

// async function sair() {
//   await signOut(auth);
//   atualizarStatusUser();
//   const tabela = document.getElementById("tabela-dados");
//   if (tabela) tabela.innerHTML = "";
// }


// // === HELPERS: DATA/HORA =====================================================
// function normalizarDia(diaStr) {
//   if (!diaStr) return "";
//   const [d, m, a] = diaStr.split("/").map(s => s.trim());
//   const dd = String(d).padStart(2, "0");
//   const mm = String(m).padStart(2, "0");
//   return `${dd}/${mm}/${a}`;
// }

// // Lê #dia como type="date" (YYYY-MM-DD) ou dd/mm/yyyy e retorna dd/mm/yyyy
// function lerDiaNormalizado() {
//   const el = document.getElementById("dia");
//   if (!el) return "";
//   const v = el.value?.trim();
//   if (!v) return "";
//   if (el.type === "date" || /^\d{4}-\d{2}-\d{2}$/.test(v)) {
//     const [yyyy, mm, dd] = v.split("-");
//     return `${dd}/${mm}/${yyyy}`;
//   }
//   return normalizarDia(v);
// }

// // Define hoje no input[type=date] (se existir)
// (function setHojeNoDate() {
//   const el = document.getElementById("dia");
//   if (!el || el.type !== "date") return;
//   const hoje = new Date();
//   const yyyy = hoje.getFullYear();
//   const mm = String(hoje.getMonth()+1).padStart(2,"0");
//   const dd = String(hoje.getDate()).padStart(2,"0");
//   el.value = `${yyyy}-${mm}-${dd}`;
// })();

// // ID seguro YYYY-MM-DD (sem "/")
// function docIdFromDia(diaDDMMYYYY) {
//   const [dd, mm, yyyy] = diaDDMMYYYY.split("/");
//   return `${yyyy}-${mm}-${dd}`;
// }


// // === NOTIFICAÇÕES PWA (LOCAL) ==============================================
// // Permissão
// async function ensureNotificationPermission() {
//   if (!('Notification' in window)) return false;
//   if (Notification.permission === 'granted') return true;
//   if (Notification.permission === 'denied') return false;
//   const res = await Notification.requestPermission();
//   return res === 'granted';
// }

// // Mostra via Service Worker (quando pronto)
// async function showPWANotification(title, body) {
//   try {
//     const ok = await ensureNotificationPermission();
//     if (!ok) return;

//     const reg = await navigator.serviceWorker?.ready; // garante SW ativo
//     const iconPath  = './icon-192x192.png';
//     const badgePath = './icon-192x192.png';

//     if (reg?.showNotification) {
//       await reg.showNotification(title, {
//         body,
//         icon: iconPath,
//         badge: badgePath,
//         vibrate: [200, 100, 200],
//         requireInteraction: false,
//       });
//     } else {
//       new Notification(title, { body, icon: iconPath });
//     }
//   } catch (e) {
//     console.warn('Falha ao mostrar notificação:', e);
//   }
// }

// // Helpers de datas
// function parseDiaHoraToDate(diaDDMMYYYY, hhmm) {
//   const [dd, mm, yyyy] = diaDDMMYYYY.split('/').map(Number);
//   const [h, m] = hhmm.split(':').map(Number);
//   return new Date(yyyy, mm - 1, dd, h, m, 0, 0);
// }
// function addMinutes(date, minutes) {
//   return new Date(date.getTime() + minutes * 60 * 1000);
// }
// function msUntil(targetDate) {
//   return targetDate.getTime() - Date.now();
// }

// // Agendador local (enquanto o app estiver ativo/em 2º plano)
// let exitTimerId = null;

// async function scheduleExitNotification(diaDDMMYYYY, entradaHHMM) {
//   // 9h22 = 562 minutos
//   const entradaDate = parseDiaHoraToDate(diaDDMMYYYY, entradaHHMM);
//   const saidaDate   = addMinutes(entradaDate, 9 * 60 + 22);

//   // Persistência pra re-agendar após refresh
//   localStorage.setItem('nextExitAt', String(saidaDate.getTime()));
//   localStorage.setItem('nextExitLabel', saidaDate.toTimeString().slice(0,5)); // HH:MM

//   // Log de apoio
//   console.log('[Notificação] Entrada:', diaDDMMYYYY, entradaHHMM, '→ Saída prevista:', saidaDate.toString());

//   // Limpa anterior
//   if (exitTimerId) {
//     clearTimeout(exitTimerId);
//     exitTimerId = null;
//   }

//   const delay = msUntil(saidaDate);
//   if (delay <= 0) {
//     await showPWANotification('Hora de sair!', `Seu horário de saída era às ${localStorage.getItem('nextExitLabel')}`);
//     return;
//   }

//   exitTimerId = setTimeout(async () => {
//     await showPWANotification('Hora de sair!', `Seu horário de saída é às ${localStorage.getItem('nextExitLabel')}`);
//     localStorage.removeItem('nextExitAt');
//     localStorage.removeItem('nextExitLabel');
//     exitTimerId = null;
//   }, delay);
// }

// // Reagenda se houver algo pendente no localStorage
// async function resumeScheduledNotificationIfAny() {
//   const ts = Number(localStorage.getItem('nextExitAt') || 0);
//   const label = localStorage.getItem('nextExitLabel');
//   if (!ts) return;
//   const delay = ts - Date.now();
//   if (delay <= 0) {
//     await showPWANotification('Hora de sair!', `Seu horário de saída era às ${label}`);
//     localStorage.removeItem('nextExitAt');
//     localStorage.removeItem('nextExitLabel');
//     return;
//   }
//   if (exitTimerId) clearTimeout(exitTimerId);
//   exitTimerId = setTimeout(async () => {
//     await showPWANotification('Hora de sair!', `Seu horário de saída é às ${label}`);
//     localStorage.removeItem('nextExitAt');
//     localStorage.removeItem('nextExitLabel');
//     exitTimerId = null;
//   }, delay);
// }


// // === SALVAR ENTRADA/SAÍDA NO FIRESTORE =====================================
// async function salvarEntrada() {
//   const user = auth.currentUser;
//   if (!user) { alert("Autenticando... tente novamente."); return; }

//   const dia = lerDiaNormalizado();
//   const entrada = document.getElementById("entrada")?.value?.trim();

//   if (!dia)     { alert("Selecione o dia!"); return; }
//   if (!entrada) { alert("Informe o horário de entrada!"); return; }

//   const docId = docIdFromDia(dia);
//   const docRef = doc(db, "pontos", docId);

//   const payload = { ownerUid: user.uid, dia, entrada };
//   console.log("Salvar ENTRADA payload:", payload);

//   await setDoc(docRef, payload, { merge: true });

//   // Saída prevista + 9h22
//   let [h, m] = entrada.split(":").map(Number);
//   m += 22; h += 9 + Math.floor(m / 60); m = m % 60;
//   const saidaPrev = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;

//   alert(`Seu horário de saída será às ${saidaPrev}`);

//   // Notificação & agendamento
//   await scheduleExitNotification(dia, entrada);

//   carregarDados();
// }

// async function salvarSaida() {
//   const user = auth.currentUser;
//   if (!user) { alert("Autenticando... tente novamente."); return; }

//   const dia   = lerDiaNormalizado();
//   const saida = document.getElementById("saida")?.value?.trim();

//   if (!dia)   { alert("Selecione o dia!"); return; }
//   if (!saida) { alert("Informe o horário de saída!"); return; }

//   const docId = docIdFromDia(dia);
//   const docRef = doc(db, "pontos", docId);
//   const snap = await getDoc(docRef);

//   if (!snap.exists()) {
//     alert("Ainda não há ENTRADA registrada para este dia. Salve a entrada primeiro.");
//     return;
//   }
//   const dados = snap.data();
//   if (dados.ownerUid !== user.uid) {
//     alert("Você não tem permissão para alterar este registro.");
//     return;
//   }

//   const novos = { ...dados, saida };

//   // Calcula horas/saldo se houver entrada
//   if (novos.entrada) {
//     const [h1, m1] = novos.entrada.split(":").map(Number);
//     const [h2, m2] = saida.split(":").map(Number);
//     const worked   = h2*60 + m2 - (h1*60 + m1);
//     const expected = 9*60 + 22;
//     const diff     = worked - expected;

//     const wh = Math.max(0, Math.floor(worked/60));
//     const wm = Math.max(0, worked % 60);
//     novos.horas = `${String(wh).padStart(2,"0")}:${String(wm).padStart(2,"0")}`;

//     const dh = Math.floor(Math.abs(diff)/60);
//     const dm = Math.abs(diff) % 60;
//     novos.resultado = `${diff < 0 ? "-" : "+"}${String(dh).padStart(2,"0")}:${String(dm).padStart(2,"0")}`;

//     mostrarResultadoDoDia(novos.horas, novos.resultado);
//   }

//   novos.ownerUid = user.uid;
//   novos.dia = dia;

//   console.log("Salvar SAÍDA payload:", novos);
//   await setDoc(docRef, novos, { merge: true });

//   carregarDados();
// }


// // === LISTAGEM (APENAS DO USUÁRIO ATUAL) ====================================
// // async function carregarDados() {
// //   const tabela = document.getElementById("tabela-dados");
// //   if (!tabela) return;
// //   tabela.innerHTML = "";

// //   const user = auth.currentUser;
// //   if (!user) return;

// //   const q = query(collection(db, "pontos"), where("ownerUid","==", user.uid));
// //   const snap = await getDocs(q);
// //   const registros = [];
// //   snap.forEach(d => registros.push(d.data()));

// //   // ordena por data (dd/mm/yyyy → Date)
// //   registros.sort((a,b) => {
// //     const [da,ma,aa] = a.dia.split("/").map(Number);
// //     const [db,mb,ab] = b.dia.split("/").map(Number);
// //     return new Date(aa,ma-1,da) - new Date(ab,mb-1,db);
// //   });

// //   registros.forEach(item => {
// //     const row = tabela.insertRow();
// //     row.insertCell(0).textContent = item.dia || "—";
// //     row.insertCell(1).textContent = item.entrada || "—";
// //     row.insertCell(2).textContent = item.saida || "—";
// //     row.insertCell(3).textContent = item.horas || "—";
// //     row.insertCell(4).textContent = item.resultado || "—";
// //   });
// // }
// function renderizarPontos(pontos) {
//   const container = document.getElementById("accordion-pontos");
//   const tipo = document.getElementById("tipo-agrupamento").value;
//   container.innerHTML = "";
//   if (!pontos.length) {
//     container.innerHTML = `
//       <div class="text-center text-muted mt-4">
//         Nenhum registro encontrado
//       </div>`;
//     return;
//   }

//   let grupos = {};

//   pontos.forEach(p => {
//     const [dia, mes, ano] = p.dia.split("/");
//     let chave;
//     if (tipo === "ano") chave = ano;
//     else if (tipo === "mes") chave = mes + "/" + ano;
//     else chave = "todos";
//     if (!grupos[chave]) grupos[chave] = [];
//     grupos[chave].push(p);
//   });

//   let index = 0;

//   Object.keys(grupos).forEach(grupo => {

//     const registros = grupos[grupo];

//     const rows = registros.map(r => `
//       <tr>
//         <td>${r.dia}</td>
//         <td>${r.entrada || "-"}</td>
//         <td>${r.saida || "-"}</td>
//         <td>${r.horas || "-"}</td>
//         <td>${r.resultado || "-"}</td>
//       </tr>
//     `).join("");

//     container.innerHTML += `
//       <div class="accordion-item">
//         <h2 class="accordion-header">
//           <button class="accordion-button ${index !== 0 ? 'collapsed' : ''}" data-bs-toggle="collapse" data-bs-target="#grupo-${index}">
//             ${grupo} (${registros.length})
//           </button>
//         </h2>

//         <div id="grupo-${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}">
//           <div class="accordion-body">
//             <table class="table table-sm">
//               <thead>
//                 <tr>
//                   <th>Dia</th>
//                   <th>Entrada</th>
//                   <th>Saída</th>
//                   <th>Horas</th>
//                   <th>Resultado</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 ${rows}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     `;
//     index++;
//   });
// }

// document
// .getElementById("tipo-agrupamento")
// .addEventListener("change", () => {
//   renderizarPontos(cachePontos);
// });

// // === EVENTOS E BOOT =========================================================
// authReady.then(() => {
//   atualizarStatusUser();

//   document.getElementById("btn-login-google")?.addEventListener("click", entrarComGoogle);
//   document.getElementById("btn-sair")?.addEventListener("click", sair);

//   document.getElementById("btn-resultado-entrada")?.addEventListener("click", salvarEntrada);
//   document.getElementById("btn-resultado-saida")?.addEventListener("click", salvarSaida);

//   carregarDados();

//   // Reagenda notificações pendentes apenas quando o SW estiver PRONTO
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.ready
//       .then(() => resumeScheduledNotificationIfAny())
//       .catch(() => resumeScheduledNotificationIfAny()); // fallback
//   } else {
//     resumeScheduledNotificationIfAny();
//   }
// });

// // (Opcional) Botão de teste (se existir no HTML)
// document.getElementById('btn-teste-notificacao')?.addEventListener('click', async () => {
//   const ok = await ensureNotificationPermission();
//   if (!ok) return alert('Permita as notificações para testar.');
//   setTimeout(() => showPWANotification('Teste', 'Notificação de teste após 10 segundos.'), 10000);
//   alert('Teste agendado para 10 segundos.');
// });

import {
  db, auth, authReady,
  GoogleAuthProvider, signInWithPopup, linkWithPopup, signOut
} from "./firebase-config.js";

import {
  doc, getDoc, setDoc, collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

/* =======================
   UI: CONTA
======================= */
function atualizarStatusUser() {
  const u = auth.currentUser;

  const icon = document.getElementById("user-icon");
  const label = document.getElementById("user-label");

  if (!u) {
    if (icon) icon.className = "bi bi-person fs-5";
    if (label) label.textContent = "Carregando...";
    atualizarUIConta(null);
    return;
  }

  if (u.isAnonymous) {
    if (icon) icon.className = "bi bi-person fs-5";
    if (label) label.textContent = "Convidado";
  } else {
    if (icon) icon.className = "bi bi-person-check fs-5";
    if (label) label.textContent = u.displayName || u.email || "Conta";
  }

  atualizarUIConta(u);
}

function atualizarUIConta(u) {
  const mIcon = document.getElementById("modal-user-icon");
  const mName = document.getElementById("modal-user-name");
  const mEmail = document.getElementById("modal-user-email");
  const boxLog = document.getElementById("actions-logged");
  const boxAnon = document.getElementById("actions-anon");

  if (!u) {
    if (mIcon) mIcon.className = "bi bi-person fs-2";
    if (mName) mName.textContent = "Carregando...";
    if (mEmail) mEmail.textContent = "";
    boxLog?.classList.add("d-none");
    boxAnon?.classList.add("d-none");
    return;
  }

  if (u.isAnonymous) {
    if (mIcon) mIcon.className = "bi bi-person fs-2";
    if (mName) mName.textContent = "Convidado (anônimo)";
    if (mEmail) mEmail.textContent = "Entre para sincronizar seus pontos";
    boxLog?.classList.add("d-none");
    boxAnon?.classList.remove("d-none");
  } else {
    if (mIcon) mIcon.className = "bi bi-person-check fs-2";
    if (mName) mName.textContent = u.displayName || "Usuário";
    if (mEmail) mEmail.textContent = u.email || "";
    boxAnon?.classList.add("d-none");
    boxLog?.classList.remove("d-none");
  }
}

async function entrarComGoogle() {
  const provider = new GoogleAuthProvider();
  const u = auth.currentUser;

  try {
    if (u && u.isAnonymous) {
      await linkWithPopup(u, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
    atualizarStatusUser();
    carregarDados();
  } catch (e) {
    if (e.code === "auth/credential-already-in-use") {
      await signInWithPopup(auth, provider);
      atualizarStatusUser();
      carregarDados();
    } else {
      console.error("Erro no Google auth:", e);
      alert("Não foi possível entrar com Google.");
    }
  }
}

async function sair() {
  await signOut(auth);
  atualizarStatusUser();
  limparAccordion();
}

/* =======================
   HELPERS DE DATA
======================= */
function normalizarDia(diaStr) {
  if (!diaStr) return "";
  const [d, m, a] = diaStr.split("/").map(s => s.trim());
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}`;
}

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

(function setHojeNoDate() {
  const el = document.getElementById("dia");
  if (!el || el.type !== "date") return;
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  el.value = `${yyyy}-${mm}-${dd}`;
})();

function docIdFromDia(diaDDMMYYYY) {
  const [dd, mm, yyyy] = diaDDMMYYYY.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDiaParts(dia) {
  const [dd, mm, yyyy] = dia.split("/");
  return { dd, mm, yyyy };
}

/* =======================
   NOTIFICAÇÃO
======================= */
async function ensureNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

async function showPWANotification(title, body) {
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return;

    const reg = await navigator.serviceWorker?.ready;
    if (reg?.showNotification) {
      await reg.showNotification(title, {
        body,
        icon: "./icon-192x192.png",
        badge: "./icon-192x192.png",
        vibrate: [200, 100, 200]
      });
    } else {
      new Notification(title, { body, icon: "./icon-192x192.png" });
    }
  } catch (e) {
    console.warn("Falha ao mostrar notificação:", e);
  }
}

function parseDiaHoraToDate(diaDDMMYYYY, hhmm) {
  const [dd, mm, yyyy] = diaDDMMYYYY.split("/").map(Number);
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(yyyy, mm - 1, dd, h, m, 0, 0);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

let exitTimerId = null;

async function scheduleExitNotification(diaDDMMYYYY, entradaHHMM) {
  const entradaDate = parseDiaHoraToDate(diaDDMMYYYY, entradaHHMM);
  const saidaDate = addMinutes(entradaDate, 9 * 60 + 22);

  localStorage.setItem("nextExitAt", String(saidaDate.getTime()));
  localStorage.setItem("nextExitLabel", saidaDate.toTimeString().slice(0, 5));

  if (exitTimerId) clearTimeout(exitTimerId);

  const delay = saidaDate.getTime() - Date.now();
  if (delay <= 0) {
    await showPWANotification("Hora de sair!", `Seu horário de saída era às ${localStorage.getItem("nextExitLabel")}`);
    return;
  }

  exitTimerId = setTimeout(async () => {
    await showPWANotification("Hora de sair!", `Seu horário de saída é às ${localStorage.getItem("nextExitLabel")}`);
    localStorage.removeItem("nextExitAt");
    localStorage.removeItem("nextExitLabel");
    exitTimerId = null;
  }, delay);
}

async function resumeScheduledNotificationIfAny() {
  const ts = Number(localStorage.getItem("nextExitAt") || 0);
  const label = localStorage.getItem("nextExitLabel");
  if (!ts) return;

  const delay = ts - Date.now();

  if (delay <= 0) {
    await showPWANotification("Hora de sair!", `Seu horário de saída era às ${label}`);
    localStorage.removeItem("nextExitAt");
    localStorage.removeItem("nextExitLabel");
    return;
  }

  if (exitTimerId) clearTimeout(exitTimerId);

  exitTimerId = setTimeout(async () => {
    await showPWANotification("Hora de sair!", `Seu horário de saída é às ${label}`);
    localStorage.removeItem("nextExitAt");
    localStorage.removeItem("nextExitLabel");
    exitTimerId = null;
  }, delay);
}

/* =======================
   SALVAR ENTRADA/SAÍDA
======================= */
async function salvarEntrada() {
  const user = auth.currentUser;
  if (!user) { alert("Autenticando... tente novamente."); return; }

  const dia = lerDiaNormalizado();
  const entrada = document.getElementById("entrada")?.value?.trim();

  if (!dia) { alert("Selecione o dia!"); return; }
  if (!entrada) { alert("Informe o horário de entrada!"); return; }

  const docRef = doc(db, "pontos", docIdFromDia(dia));

  const payload = { ownerUid: user.uid, dia, entrada };
  await setDoc(docRef, payload, { merge: true });

  let [h, m] = entrada.split(":").map(Number);
  m += 22;
  h += 9 + Math.floor(m / 60);
  m = m % 60;

  const saidaPrev = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  alert(`Seu horário de saída será às ${saidaPrev}`);

  await scheduleExitNotification(dia, entrada);
  carregarDados();
}

async function salvarSaida() {
  const user = auth.currentUser;
  if (!user) { alert("Autenticando... tente novamente."); return; }

  const dia = lerDiaNormalizado();
  const saida = document.getElementById("saida")?.value?.trim();

  if (!dia) { alert("Selecione o dia!"); return; }
  if (!saida) { alert("Informe o horário de saída!"); return; }

  const docRef = doc(db, "pontos", docIdFromDia(dia));
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

  if (novos.entrada) {
    const [h1, m1] = novos.entrada.split(":").map(Number);
    const [h2, m2] = saida.split(":").map(Number);

    const worked = h2 * 60 + m2 - (h1 * 60 + m1);
    const expected = 9 * 60 + 22;
    const diff = worked - expected;

    const wh = Math.max(0, Math.floor(worked / 60));
    const wm = Math.max(0, worked % 60);
    novos.horas = `${String(wh).padStart(2, "0")}:${String(wm).padStart(2, "0")}`;

    const dh = Math.floor(Math.abs(diff) / 60);
    const dm = Math.abs(diff) % 60;
    novos.resultado = `${diff < 0 ? "-" : "+"}${String(dh).padStart(2, "0")}:${String(dm).padStart(2, "0")}`;

    mostrarResultadoDoDia(novos.horas, novos.resultado);
  }

  novos.ownerUid = user.uid;
  novos.dia = dia;

  await setDoc(docRef, novos, { merge: true });
  carregarDados();
}

function mostrarResultadoDoDia(horas, resultado) {
  const msg = `
    <div class="alert alert-info mt-3" role="alert">
      <strong>Resumo do dia:</strong><br>
      Horas trabalhadas: ${horas}<br>
      Saldo: ${resultado.startsWith("+") ? "🟢 " : "🔴 "}${resultado}
    </div>
  `;
  const container = document.querySelector(".container");
  if (!container) return;
  container.querySelector(".alert")?.remove();
  container.insertAdjacentHTML("beforeend", msg);
}

/* =======================
   ACCORDION DINÂMICO
======================= */
let cachePontos = [];

function limparAccordion() {
  const container = document.getElementById("accordion-pontos");
  if (container) container.innerHTML = "";
}

function renderizarPontos(pontos) {
  const container = document.getElementById("accordion-pontos");
  const select = document.getElementById("tipo-agrupamento");

  if (!container || !select) return;

  const tipo = select.value;
  container.innerHTML = "";

  if (!pontos.length) {
    container.innerHTML = `
      <div class="text-center text-muted mt-4">
        Nenhum registro encontrado
      </div>
    `;
    return;
  }

  const grupos = {};

  pontos.forEach(p => {
    const { mm, yyyy } = parseDiaParts(p.dia);

    let chave = "todos";
    if (tipo === "ano") chave = yyyy;
    if (tipo === "mes") chave = `${mm}/${yyyy}`;

    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(p);
  });

  let index = 0;

  Object.keys(grupos).sort((a, b) => a.localeCompare(b)).forEach(grupo => {
    const registros = grupos[grupo];

    registros.sort((a, b) => {
      const da = docIdFromDia(a.dia);
      const db = docIdFromDia(b.dia);
      return da.localeCompare(db);
    });

    const rows = registros.map(r => `
      <tr>
        <td>${r.dia}</td>
        <td>${r.entrada || "-"}</td>
        <td>${r.saida || "-"}</td>
        <td>${r.horas || "-"}</td>
        <td class="${(r.resultado || "").startsWith("+") ? "text-success" : "text-danger"}">${r.resultado || "-"}</td>
      </tr>
    `).join("");

    container.innerHTML += `
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button ${index !== 0 ? "collapsed" : ""}"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#grupo-${index}">
            ${grupo} (${registros.length})
          </button>
        </h2>

        <div id="grupo-${index}" class="accordion-collapse collapse ${index === 0 ? "show" : ""}">
          <div class="accordion-body">
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Dia</th>
                    <th>Entrada</th>
                    <th>Saída</th>
                    <th>Horas</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    index++;
  });
}

/* =======================
   FIRESTORE -> CACHE -> UI
======================= */
async function carregarDados() {
  const user = auth.currentUser;
  if (!user) {
    cachePontos = [];
    limparAccordion();
    return;
  }

  const q = query(collection(db, "pontos"), where("ownerUid", "==", user.uid));
  const snap = await getDocs(q);

  const registros = [];
  snap.forEach(d => registros.push(d.data()));

  registros.sort((a, b) => {
    const da = docIdFromDia(a.dia);
    const db = docIdFromDia(b.dia);
    return da.localeCompare(db);
  });

  cachePontos = registros;
  renderizarPontos(cachePontos);
}

/* =======================
   BOOT
======================= */
authReady.then(() => {
  atualizarStatusUser();

  document.getElementById("btn-login-google")?.addEventListener("click", entrarComGoogle);
  document.getElementById("btn-sair")?.addEventListener("click", sair);

  document.getElementById("btn-resultado-entrada")?.addEventListener("click", salvarEntrada);
  document.getElementById("btn-resultado-saida")?.addEventListener("click", salvarSaida);

  document.getElementById("tipo-agrupamento")?.addEventListener("change", () => {
    renderizarPontos(cachePontos);
  });

  document.getElementById("btn-teste-notificacao")?.addEventListener("click", async () => {
    const ok = await ensureNotificationPermission();
    if (!ok) return alert("Permita as notificações para testar.");
    setTimeout(() => showPWANotification("Teste", "Notificação de teste após 10 segundos."), 10000);
    alert("Teste agendado para 10 segundos.");
  });

  carregarDados();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then(() => resumeScheduledNotificationIfAny())
      .catch(() => resumeScheduledNotificationIfAny());
  } else {
    resumeScheduledNotificationIfAny();
  }
});