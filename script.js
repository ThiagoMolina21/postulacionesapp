const STORAGE_KEY = "postulaciones_app_data";

const initialData = [
  {
    id: 1,
    empresa: "Mercado Libre",
    rol: "Frontend Developer",
    fecha: "2026-10-10",
    estado: "Enviado",
  },
  {
    id: 2,
    empresa: "Globant",
    rol: "UI Developer",
    fecha: "2026-10-12",
    estado: "En proceso",
  },
  {
    id: 3,
    empresa: "UTN",
    rol: "Analista de Sistemas",
    fecha: "2026-10-08",
    estado: "Rechazado",
  },
];

const form = document.getElementById("formPostulacion");
const postulacionesList = document.getElementById("postulacionesList");
const emptyState = document.getElementById("emptyState");
const totalPostulaciones = document.getElementById("totalPostulaciones");

let postulaciones = loadData();

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return initialData;
    }

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : initialData;
  } catch (error) {
    return initialData;
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(postulaciones));
  } catch (error) {
    console.error("No se pudo guardar en localStorage:", error);
  }
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

function renderPostulaciones() {
  if (!postulaciones.length) {
    postulacionesList.innerHTML = "";
    emptyState.classList.remove("hidden");
    totalPostulaciones.textContent = "0";
    return;
  }

  emptyState.classList.add("hidden");
  totalPostulaciones.textContent = String(postulaciones.length);

  postulacionesList.innerHTML = postulaciones
    .map((postulacion) => {
      const statusClass = getStatusClass(postulacion.estado);
      const options = [
        "Enviado",
        "En proceso",
        "Rechazado",
        "Oferta",
      ]
        .map(
          (estado) =>
            `<option value="${estado}" ${postulacion.estado === estado ? "selected" : ""}>${estado}</option>`
        )
        .join("");

      return `
        <article class="postulacion-item">
          <div class="postulacion-top">
            <div>
              <h3 class="company-name">${postulacion.empresa}</h3>
              <p class="role-name">${postulacion.rol}</p>
            </div>
            <span class="status ${statusClass}">${postulacion.estado}</span>
          </div>

          <div class="meta">
            <span>📅 ${formatDate(postulacion.fecha)}</span>
            <label>
              <span>Estado:</span>
              <select class="status-select" data-id="${postulacion.id}" aria-label="Cambiar estado de ${postulacion.empresa}">
                ${options}
              </select>
            </label>
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
      renderPostulaciones();
    });
  });
}

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
  });

  saveData();
  renderPostulaciones();
  form.reset();
  document.getElementById("estado").value = "Enviado";
});

renderPostulaciones();
