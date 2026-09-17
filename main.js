import {
  db, auth, authReady,
  GoogleAuthProvider, signInWithPopup, linkWithPopup,
  signInWithRedirect, linkWithRedirect, signOut
} from "./firebase-config.js";

import {
  doc, getDoc, setDoc, collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

function aplicarTemaSalvo() {
  const tema = localStorage.getItem("tema") || "light";
  document.documentElement.dataset.theme = tema;
  atualizarBotaoTema(tema);
}

function atualizarBotaoTema(tema) {
  const botao = document.getElementById("theme-toggle");
  if (!botao) return;
  const escuro = tema === "dark";
  botao.innerHTML = `<i class="bi ${escuro ? "bi-sun" : "bi-moon-stars"}"></i>`;
  botao.setAttribute("aria-label", escuro ? "Ativar tema claro" : "Ativar tema escuro");
  botao.title = escuro ? "Tema claro" : "Tema escuro";
}

function alternarTema() {
  const tema = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = tema;
  localStorage.setItem("tema", tema);
  atualizarBotaoTema(tema);
}

aplicarTemaSalvo();

function mostrarAviso(mensagem, tipo = "info", duracao = 4500) {
  let container = document.getElementById("avisos-app");
  if (!container) {
    container = document.createElement("div");
    container.id = "avisos-app";
    container.className = "avisos-app";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const icones = {
    sucesso: "bi-check-circle-fill",
    erro: "bi-exclamation-triangle-fill",
    aviso: "bi-exclamation-circle-fill",
    info: "bi-info-circle-fill"
  };

  const aviso = document.createElement("div");
  aviso.className = `aviso-app aviso-${tipo}`;
  aviso.setAttribute("role", "alert");
  aviso.innerHTML = `
    <i class="bi ${icones[tipo] || icones.info}" aria-hidden="true"></i>
    <span></span>
    <button type="button" class="aviso-fechar" aria-label="Fechar aviso">
      <i class="bi bi-x-lg" aria-hidden="true"></i>
    </button>
  `;
  aviso.querySelector("span").textContent = mensagem;

  const fechar = () => {
    aviso.classList.add("aviso-saindo");
    setTimeout(() => aviso.remove(), 180);
  };

  aviso.querySelector(".aviso-fechar").addEventListener("click", fechar);
  container.appendChild(aviso);
  setTimeout(fechar, duracao);
}

function confirmarAcao(titulo, mensagem) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "confirmacao-app";
    overlay.innerHTML = `
      <div class="confirmacao-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmacao-titulo">
        <div class="confirmacao-icone"><i class="bi bi-exclamation-triangle-fill"></i></div>
        <div class="confirmacao-conteudo">
          <h2 id="confirmacao-titulo"></h2>
          <p></p>
        </div>
        <div class="confirmacao-acoes">
          <button type="button" class="btn btn-light confirmacao-cancelar">Cancelar</button>
          <button type="button" class="btn btn-primary confirmacao-confirmar">Confirmar</button>
        </div>
      </div>
    `;
    overlay.querySelector("h2").textContent = titulo;
    overlay.querySelector("p").textContent = mensagem;

    function aoPressionarTecla(event) {
      if (event.key === "Escape") finalizar(false);
    }

    const finalizar = resultado => {
      document.removeEventListener("keydown", aoPressionarTecla);
      overlay.remove();
      resolve(resultado);
    };

    overlay.querySelector(".confirmacao-cancelar").addEventListener("click", () => finalizar(false));
    overlay.querySelector(".confirmacao-confirmar").addEventListener("click", () => finalizar(true));
    overlay.addEventListener("click", event => {
      if (event.target === overlay) finalizar(false);
    });
    document.addEventListener("keydown", aoPressionarTecla);

    document.body.appendChild(overlay);
    overlay.querySelector(".confirmacao-confirmar").focus();
  });
}

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
  const avisoLogin = document.getElementById("aviso-login");

  if (avisoLogin) {
    avisoLogin.classList.toggle("d-none", Boolean(u && !u.isAnonymous));
  }

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

let loginEmProgresso = false;

const minutosExtrasPadraoPorAno = {
  2025: 22,
  2026: 18
};

let minutosExtrasPorAno = { ...minutosExtrasPadraoPorAno };

async function carregarConfiguracao() {
  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "configuracoes", user.uid));
  if (snap.exists()) {
    const configuracao = snap.data().minutosExtrasPorAno;
    if (configuracao && typeof configuracao === "object") {
      minutosExtrasPorAno = { ...minutosExtrasPadraoPorAno, ...configuracao };
      return;
    }
  }

  minutosExtrasPorAno = { ...minutosExtrasPadraoPorAno };
}

function renderizarConfiguracao() {
  const container = document.getElementById("configuracao-anos");
  if (!container) return;

  const anos = Object.keys(minutosExtrasPorAno).sort();
  container.innerHTML = anos.map(ano => `
    <div class="row g-2 mb-2 configuracao-linha">
      <div class="col-6">
        <label class="visually-hidden" for="ano-${ano}">Ano</label>
        <input id="ano-${ano}" class="form-control config-ano" type="number" min="2000" max="2100" value="${ano}">
      </div>
      <div class="col-6">
        <label class="visually-hidden" for="minutos-${ano}">Minutos extras</label>
        <input id="minutos-${ano}" class="form-control config-minutos" type="number" min="0" max="180" value="${minutosExtrasPorAno[ano]}">
      </div>
    </div>
  `).join("");
}

async function salvarConfiguracao() {
  const user = auth.currentUser;
  if (!user) {
    mostrarAviso("Autenticando... tente novamente.", "aviso");
    return;
  }

  const anos = [...document.querySelectorAll(".config-ano")];
  const minutos = [...document.querySelectorAll(".config-minutos")];
  const novaConfiguracao = {};

  for (let i = 0; i < anos.length; i++) {
    const ano = Number(anos[i].value);
    const valor = Number(minutos[i].value);
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100 || !Number.isInteger(valor) || valor < 0 || valor > 180) {
      mostrarAviso("Informe anos entre 2000 e 2100 e minutos entre 0 e 180.", "aviso");
      return;
    }
    if (novaConfiguracao[ano] !== undefined) {
      mostrarAviso("Não repita o mesmo ano.", "aviso");
      return;
    }
    novaConfiguracao[ano] = valor;
  }

  try {
    await setDoc(doc(db, "configuracoes", user.uid), {
      ownerUid: user.uid,
      minutosExtrasPorAno: novaConfiguracao
    }, { merge: true });
  } catch (e) {
    console.error("Erro ao salvar configuração:", e);
    mostrarAviso("Não foi possível salvar. Publique as regras do Firestore e tente novamente.", "erro");
    return;
  }

  minutosExtrasPorAno = novaConfiguracao;
  renderizarConfiguracao();
  mostrarAviso("Configuração salva.", "sucesso");
}

function minutosExtrasDoDia(diaDDMMYYYY) {
  const { yyyy } = parseDiaParts(diaDDMMYYYY);
  const ano = Number(yyyy);
  const padrao = ano >= 2026 ? 18 : 22;
  const minutos = Number(minutosExtrasPorAno[yyyy] ?? padrao);
  return Number.isInteger(minutos) && minutos >= 0 ? minutos : padrao;
}

function calcularHorarioSaida(diaDDMMYYYY, entradaHHMM) {
  const entradaDate = parseDiaHoraToDate(diaDDMMYYYY, entradaHHMM);
  const saidaDate = addMinutes(entradaDate, 9 * 60 + minutosExtrasDoDia(diaDDMMYYYY));
  return saidaDate.toTimeString().slice(0, 5);
}

async function carregarEntradaDoDia() {
  const campoEntrada = document.getElementById("entrada");
  const resumo = document.getElementById("resumo-entrada");
  if (!campoEntrada || !resumo) return;

  const user = auth.currentUser;
  const dia = lerDiaNormalizado();
  if (!user || !dia) return;

  try {
    await carregarConfiguracao();
    const snap = await getDoc(doc(db, "pontos", docIdFromDia(dia)));
    const dados = snap.exists() ? snap.data() : null;

    if (!dados || dados.ownerUid !== user.uid || !dados.entrada) {
      campoEntrada.value = "";
      resumo.textContent = "Nenhuma entrada salva para este dia.";
      return;
    }

    campoEntrada.value = dados.entrada;
    resumo.textContent = `Entrada salva às ${dados.entrada}. Saída prevista: ${calcularHorarioSaida(dia, dados.entrada)}.`;
  } catch (e) {
    console.error("Erro ao carregar entrada do dia:", e);
    resumo.textContent = "Não foi possível carregar a entrada deste dia.";
  }
}

async function carregarSaidaDoDia() {
  const campoSaida = document.getElementById("saida");
  const resumo = document.getElementById("resumo-saida");
  if (!campoSaida || !resumo) return;

  const user = auth.currentUser;
  const dia = lerDiaNormalizado();
  if (!user || !dia) return;

  try {
    const snap = await getDoc(doc(db, "pontos", docIdFromDia(dia)));
    const dados = snap.exists() ? snap.data() : null;

    if (!dados || dados.ownerUid !== user.uid || !dados.saida) {
      campoSaida.value = "";
      resumo.textContent = "Nenhuma saída salva para este dia.";
      return;
    }

    campoSaida.value = dados.saida;
    resumo.textContent = `Saída salva às ${dados.saida}. Salvar outro horário pedirá confirmação.`;
  } catch (e) {
    console.error("Erro ao carregar saída do dia:", e);
    resumo.textContent = "Não foi possível carregar a saída deste dia.";
  }
}

async function entrarComGoogle() {
  if (loginEmProgresso) return;
  loginEmProgresso = true;

  try {
    const provider = new GoogleAuthProvider();
    auth.useDeviceLanguage && auth.useDeviceLanguage();

    const u = auth.currentUser;

    if (u && u.isAnonymous) await linkWithPopup(u, provider);
    else await signInWithPopup(auth, provider);
  } catch (e) {
    if (e?.code === "auth/popup-blocked" || e?.code === "auth/cancelled-popup-request") {
      try {
        const provider = new GoogleAuthProvider();
        const u = auth.currentUser;
        if (u && u.isAnonymous) await linkWithRedirect(u, provider);
        else await signInWithRedirect(auth, provider);
        return;
      } catch (e2) {
        console.error("Erro no fallback redirect:", e2);
        mostrarAviso("Não foi possível entrar com Google.", "erro");
      }
    } else if (e?.code === 'auth/credential-already-in-use') {
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } catch (e3) {
        console.error("Erro no signIn após credential-already-in-use:", e3);
        mostrarAviso("Não foi possível entrar com Google.", "erro");
      }
    } else {
      console.error("Erro no Google auth:", e);
      mostrarAviso("Não foi possível entrar com Google.", "erro");
    }
  } finally {
    loginEmProgresso = false;
    atualizarStatusUser();
    carregarDados().catch(e => {
      console.error("Erro ao carregar pontos:", e);
    });
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

async function buscarRegistroDoDia(user, dia) {
  const registrosQuery = query(
    collection(db, "pontos"),
    where("ownerUid", "==", user.uid)
  );
  const snap = await getDocs(registrosQuery);
  let registro = null;
  snap.forEach(item => {
    if (item.data().dia === dia) registro = item.data();
  });
  return registro;
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
    const dados = await buscarRegistroDoDia(user, dia);

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
  const dados = await buscarRegistroDoDia(user, dia);
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
  if (!user) { mostrarAviso("Autenticando... tente novamente.", "aviso"); return; }

  const dia = lerDiaNormalizado();
  const entrada = document.getElementById("entrada")?.value?.trim();

  if (!dia) { mostrarAviso("Selecione o dia!", "aviso"); return; }
  if (!entrada) { mostrarAviso("Informe o horário de entrada!", "aviso"); return; }

  await carregarConfiguracao();

  const docRef = doc(db, "pontos", docIdFromDia(dia));
  const registroAtual = await getDoc(docRef);
  const entradaAtual = registroAtual.exists() ? registroAtual.data().entrada : null;

  if (entradaAtual) {
    const confirmou = await confirmarAcao(
      "Sobrescrever entrada?",
      `Já existe uma entrada registrada às ${entradaAtual}. Deseja substituir esse horário?`
    );
    if (!confirmou) return;
  }

  const payload = { ownerUid: user.uid, dia, entrada };
  await setDoc(docRef, payload, { merge: true });

  const saidaPrev = calcularHorarioSaida(dia, entrada);
  mostrarAviso(`Seu horário de saída será às ${saidaPrev}`, "sucesso");
  await carregarEntradaDoDia();

  await scheduleExitNotification(dia, entrada);
  carregarDados().catch(e => {
    console.error("Erro ao carregar pontos:", e);
  });
}

async function salvarSaida() {
  const user = auth.currentUser;
  if (!user) { mostrarAviso("Autenticando... tente novamente.", "aviso"); return; }

  const dia = lerDiaNormalizado();
  const saida = document.getElementById("saida")?.value?.trim();

  if (!dia) { mostrarAviso("Selecione o dia!", "aviso"); return; }
  if (!saida) { mostrarAviso("Informe o horário de saída!", "aviso"); return; }

  await carregarConfiguracao();

  const docRef = doc(db, "pontos", docIdFromDia(dia));
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    mostrarAviso("Ainda não há ENTRADA registrada para este dia. Salve a entrada primeiro.", "aviso");
    return;
  }

  const dados = snap.data();
  if (dados.ownerUid !== user.uid) {
    mostrarAviso("Você não tem permissão para alterar este registro.", "erro");
    return;
  }

  if (dados.saida) {
    const confirmou = await confirmarAcao(
      "Sobrescrever saída?",
      `Já existe uma saída registrada às ${dados.saida}. Deseja substituir esse horário?`
    );
    if (!confirmou) return;
  }

  const novos = { ...dados, saida };

  if (novos.entrada) {
    const [h1, m1] = novos.entrada.split(":").map(Number);
    const [h2, m2] = saida.split(":").map(Number);

    const worked = h2 * 60 + m2 - (h1 * 60 + m1);
    const expected = 9 * 60 + minutosExtrasDoDia(dia);
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
  await carregarSaidaDoDia();
  carregarDados().catch(e => {
    console.error("Erro ao carregar pontos:", e);
  });
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
let tipoAgrupamento = "mes";
let ordemLista = "desc"; 

function limparAccordion() {
  const container = document.getElementById("accordion-pontos");
  if (container) container.innerHTML = "";
}

function formatarNomeGrupo(grupo, tipo) {
  if (tipo !== "mes") return grupo;

  const [mm, yyyy] = grupo.split("/");
  const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long" })
    .format(new Date(Number(yyyy), Number(mm) - 1, 1));

  return `${nomeMes.charAt(0).toUpperCase()}${nomeMes.slice(1)}/${yyyy}`;
}

function renderizarPontos(pontos) {
  const container = document.getElementById("accordion-pontos");
  if (!container) return;

  const tipo = tipoAgrupamento;
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

      if (ordemLista === "desc") {
        return db.localeCompare(da);
      }

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

    const tabela = `
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
    `;

    if (tipo === "todos") {
      container.innerHTML += tabela;
    } else {
      container.innerHTML += `
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button ${index !== 0 ? "collapsed" : ""}"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#grupo-${index}">
              ${formatarNomeGrupo(grupo, tipo)}
            </button>
          </h2>

          <div id="grupo-${index}" class="accordion-collapse collapse ${index === 0 ? "show" : ""}">
            <div class="accordion-body">
              ${tabela}
            </div>
          </div>
        </div>
      `;
    }

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

  await carregarConfiguracao();

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

  document.getElementById("theme-toggle")?.addEventListener("click", alternarTema);

  carregarConfiguracao()
    .catch(e => {
      console.error("Erro ao carregar configuração:", e);
      mostrarAviso("Não foi possível carregar a configuração. Verifique as regras do Firestore.", "erro", 7000);
    })
    .finally(renderizarConfiguracao);

  document.getElementById("btn-login-google")?.addEventListener("click", entrarComGoogle);
  document.getElementById("btn-sair")?.addEventListener("click", sair);

  document.getElementById("btn-resultado-entrada")?.addEventListener("click", salvarEntrada);
  document.getElementById("btn-resultado-saida")?.addEventListener("click", salvarSaida);
  document.getElementById("dia")?.addEventListener("change", () => {
    carregarEntradaDoDia();
    carregarSaidaDoDia();
  });
  document.getElementById("btn-salvar-configuracao")?.addEventListener("click", salvarConfiguracao);
  document.getElementById("btn-adicionar-ano")?.addEventListener("click", () => {
    const container = document.getElementById("configuracao-anos");
    if (!container) return;
    const ano = new Date().getFullYear() + 1;
    container.insertAdjacentHTML("beforeend", `
      <div class="row g-2 mb-2 configuracao-linha">
        <div class="col-6"><label class="visually-hidden">Ano</label><input class="form-control config-ano" type="number" min="2000" max="2100" value="${ano}"></div>
        <div class="col-6"><label class="visually-hidden">Minutos extras</label><input class="form-control config-minutos" type="number" min="0" max="180" value="18"></div>
      </div>
    `);
  });

  document.querySelectorAll(".filtro-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filtro-btn")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      tipoAgrupamento = btn.dataset.tipo;
      renderizarPontos(cachePontos);
    });
  });

  document.getElementById("btn-teste-notificacao")?.addEventListener("click", async () => {
    const ok = await ensureNotificationPermission();
    if (!ok) {
      mostrarAviso("Permita as notificações para testar.", "aviso");
      return;
    }
    setTimeout(() => showPWANotification("Teste", "Notificação de teste após 10 segundos."), 10000);
    mostrarAviso("Teste agendado para 10 segundos.", "info");
  });

  carregarDados().catch(e => {
    console.error("Erro ao carregar pontos:", e);
  });

  carregarEntradaDoDia();
  carregarSaidaDoDia();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then(() => resumeScheduledNotificationIfAny())
      .catch(() => resumeScheduledNotificationIfAny());
  } else {
    resumeScheduledNotificationIfAny();
  }

  const ordenarBtn = document.getElementById("ordenar-btn");

  ordenarBtn?.addEventListener("click", () => {

    if (ordemLista === "desc") {
      ordemLista = "asc";
      ordenarBtn.innerHTML = `
        <i class="bi bi-sort-up"></i>
        Mais antigo
      `;
    } else {
      ordemLista = "desc";
      ordenarBtn.innerHTML = `
        <i class="bi bi-sort-down"></i>
        Mais recente
      `;
    }

    renderizarPontos(cachePontos);
    
  });
});