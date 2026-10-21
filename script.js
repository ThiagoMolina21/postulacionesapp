const STORAGE_KEY = "postulaciones_app_data";
const THEME_KEY = "postulaciones_theme";

const initialData = [];

const form = document.getElementById("formPostulacion");
const postulacionesList = document.getElementById("postulacionesList");
const emptyState = document.getElementById("emptyState");
const totalPostulaciones = document.getElementById("totalPostulaciones");
const resumen = document.getElementById("resumenEstados");
const themeToggle = document.getElementById("themeToggle");
const confirmModal = document.getElementById("confirmModal");
const confirmText = document.getElementById("confirmText");
const cancelDeleteBtn = document.getElementById("cancelDelete");
const confirmDeleteBtn = document.getElementById("confirmDelete");

let postulaciones = loadData();
let postulacionAEliminar = null;

function normalizePostulacion(postulacion) {
  return {
    ...postulacion,
    nota: typeof postulacion.nota === "string" ? postulacion.nota : "",
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizePostulacion) : [];
  } catch (error) {
    return [];
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(postulaciones));
  } catch (error) {
    console.error("No se pudo guardar en localStorage:", error);
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getStatusClass(estado) {
  const map = {
    Enviado: "status-enviado",
    "En proceso": "status-proceso",
    Rechazado: "status-rechazado",
    Oferta: "status-oferta",
  };

  return map[estado] || "status-enviado";
}

function getResumenData() {
  const estados = ["Enviado", "En proceso", "Rechazado", "Oferta"];

  return estados.map((estado) => ({
    estado,
    total: postulaciones.filter((postulacion) => postulacion.estado === estado).length,
  }));
}

function renderResumen() {
  const resumenData = getResumenData();

  resumen.innerHTML = `
    <div class="summary-card total">
      <span class="summary-label">Total</span>
      <strong>${postulaciones.length}</strong>
    </div>
    ${resumenData
      .map(
        ({ estado, total }) => `
          <div class="summary-card ${getStatusClass(estado)}">
            <span class="summary-label">${estado}</span>
            <strong>${total}</strong>
          </div>
        `
      )
      .join("")}
  `;
}

function renderPostulaciones() {
  if (!postulaciones.length) {
    postulacionesList.innerHTML = "";
    emptyState.classList.remove("hidden");
    totalPostulaciones.textContent = "0";
    renderResumen();
    return;
  }

  emptyState.classList.add("hidden");
  totalPostulaciones.textContent = String(postulaciones.length);

  postulacionesList.innerHTML = postulaciones
    .map((postulacion) => {
      const statusClass = getStatusClass(postulacion.estado);
      const options = ["Enviado", "En proceso", "Rechazado", "Oferta"]
        .map(
          (estado) =>
            `<option value="${estado}" ${postulacion.estado === estado ? "selected" : ""}>${estado}</option>`
        )
        .join("");

      return `
        <article class="postulacion-item">
          <div class="postulacion-top">
            <div>
              <h3 class="company-name">${escapeHtml(postulacion.empresa)}</h3>
              <p class="role-name">${escapeHtml(postulacion.rol)}</p>
            </div>
            <div class="item-actions">
              <span class="status ${statusClass}">${postulacion.estado}</span>
              <button class="delete-btn" data-id="${postulacion.id}" type="button">Eliminar</button>
            </div>
          </div>

          <div class="meta">
            <span>📅 ${formatDate(postulacion.fecha)}</span>
            <label>
              <span>Estado:</span>
              <select class="status-select" data-id="${postulacion.id}" aria-label="Cambiar estado de ${escapeHtml(postulacion.empresa)}">
                ${options}
              </select>
            </label>
          </div>

          <div class="note-block">
            <label class="note-label" for="nota-${postulacion.id}">Nota</label>
            <textarea
              id="nota-${postulacion.id}"
              class="postulacion-nota"
              data-id="${postulacion.id}"
              placeholder="Agregar una nota..."
            >${escapeHtml(postulacion.nota)}</textarea>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", (event) => {
      const id = Number(event.target.dataset.id);
      const estado = event.target.value;

      postulaciones = postulaciones.map((postulacion) =>
        postulacion.id === id ? { ...postulacion, estado } : postulacion
      );

      saveData();
      renderResumen();
      renderPostulaciones();
    });
  });

  document.querySelectorAll(".postulacion-nota").forEach((textarea) => {
    textarea.addEventListener("blur", (event) => {
      const id = Number(event.target.dataset.id);
      const nota = event.target.value;

      postulaciones = postulaciones.map((postulacion) =>
        postulacion.id === id ? { ...postulacion, nota } : postulacion
      );

      saveData();
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const id = Number(event.target.dataset.id);
      const postulacion = postulaciones.find((item) => item.id === id);

      if (!postulacion) {
        return;
      }

      postulacionAEliminar = postulacion;
      confirmText.textContent = `${postulacion.empresa} — ${postulacion.rol}`;
      confirmModal.classList.remove("hidden");
    });
  });

  renderResumen();
}

function closeConfirmModal() {
  confirmModal.classList.add("hidden");
  postulacionAEliminar = null;
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);

  if (themeToggle) {
    themeToggle.textContent = nextTheme === "dark" ? "☀️ Modo claro" : "🌙 Modo oscuro";
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener("click", closeConfirmModal);
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener("click", () => {
    if (!postulacionAEliminar) {
      closeConfirmModal();
      return;
    }

    postulaciones = postulaciones.filter((item) => item.id !== postulacionAEliminar.id);
    saveData();
    closeConfirmModal();
    renderPostulaciones();
  });
}

confirmModal.addEventListener("click", (event) => {
  if (event.target === confirmModal) {
    closeConfirmModal();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const empresa = document.getElementById("empresa").value.trim();
  const rol = document.getElementById("rol").value.trim();
  const fecha = document.getElementById("fecha").value;
  const estado = document.getElementById("estado").value;

  if (!empresa || !rol || !fecha) {
    return;
  }

  postulaciones.unshift({
    id: Date.now(),
    empresa,
    rol,
    fecha,
    estado,
    nota: "",
  });

  saveData();
  renderPostulaciones();
  form.reset();
  document.getElementById("estado").value = "Enviado";
});

initializeTheme();
renderPostulaciones();
