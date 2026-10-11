/* Gastos sobre el backend bds (dominio "gastos").
 * Copiado de web/plantilla/app.js: sólo se ajustó DOMINIO, TITULO, CAMPOS,
 * COLUMNAS y el total del mes. El acceso lo maneja bt-core.js.
 */
(function () {
  "use strict";

  // ── Ajustá esto por dominio ──
  var DOMINIO = "gastos";
  var TITULO = "Gastos";
  var CAMPOS = [
    { name: "monto", label: "Monto ($)", type: "text", required: true },
    { name: "detalle", label: "Detalle", type: "text", required: false }
  ];
  var COLUMNAS = ["fecha", "monto", "detalle"];

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  document.addEventListener("DOMContentLoaded", function () {
    $("titulo").textContent = TITULO;
    document.title = TITULO;
    buildForm();
    $("salir").addEventListener("click", function () { bt.logout(); });
    bt.init({
      brand: TITULO,
      onReady: function () { refresh(); },
      onLocked: function () {}
    });
  });

  function buildForm() {
    var form = $("form");
    form.innerHTML = CAMPOS.map(function (c) {
      var extra = c.name === "monto" ? ' inputmode="decimal" placeholder="1200,50"' : ' placeholder="Supermercado" maxlength="80"';
      return '<label>' + esc(c.label) + '<input name="' + esc(c.name) + '" type="' + esc(c.type || "text") + '"' +
        extra + (c.required ? " required" : "") + " /></label>";
    }).join("") + "<button type=\"submit\">Agregar</button>";
    form.addEventListener("submit", onSubmit);
    $("thead").innerHTML = COLUMNAS.map(function (c, i) {
      return '<th' + (c === "monto" ? ' class="num"' : "") + ">" + esc(c) + "</th>";
    }).join("");
  }

  function onSubmit(ev) {
    ev.preventDefault();
    var form = ev.target;
    var datos = {};
    var falta = null;
    CAMPOS.forEach(function (c) {
      var v = (form.elements[c.name] || {}).value;
      if (c.required && !String(v || "").trim()) { falta = c.label; return; }
      if (String(v || "").trim() !== "") datos[c.name] = String(v).trim();
    });
    if (falta) { setStatus("Falta: " + falta, "err"); return; }
    if (datos.monto != null && toNum(datos.monto) == null) { setStatus("Monto inválido. Ej: 1200,50", "err"); return; }
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    setStatus("Guardando…", "");
    bt.append(DOMINIO, datos).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "no se pudo guardar");
      CAMPOS.forEach(function (c) { if (form.elements[c.name]) form.elements[c.name].value = ""; });
      setStatus("Listo ✓", "ok");
      return refresh();
    }).catch(function (e) { setStatus(String((e && e.message) || e), "err"); })
      .then(function () { btn.disabled = false; });
  }

  function refresh() {
    return bt.query(DOMINIO, { limite: 200 }).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "no se pudo leer");
      var filas = res.filas || [];
      renderTotal(filas);
      var tbody = document.querySelector("#tabla tbody");
      tbody.innerHTML = filas.length ? filas.slice().reverse().map(function (f) {
        return "<tr>" + COLUMNAS.map(function (c) {
          if (c === "monto") return '<td class="num">' + esc(fmtMonto(f[c])) + "</td>";
          return "<td>" + esc(f[c]) + "</td>";
        }).join("") + "</tr>";
      }).join("") : '<tr><td colspan="' + COLUMNAS.length + '">Sin registros.</td></tr>';
    }).catch(function (e) { setStatus(String((e && e.message) || e), "err"); });
  }

  function renderTotal(filas) {
    var now = new Date();
    var total = 0, n = 0;
    filas.forEach(function (f) {
      var d = parseFecha(f.fecha);
      if (!d || d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
      var m = toNum(f.monto);
      if (m == null) return;
      total += m;
      n++;
    });
    $("totalMes").textContent = fmtMonto(total);
    var nombreMes = now.toLocaleString("es-AR", { month: "long" });
    $("totalSub").textContent = n === 0
      ? "Sin gastos en " + nombreMes + "."
      : n + (n === 1 ? " gasto" : " gastos") + " en " + nombreMes + ".";
  }

  function toNum(v) {
    if (v == null || v === "") return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    var s = String(v).trim().replace(/\$/g, "").replace(/\s/g, "");
    if (s.indexOf(",") !== -1) {
      // es-AR: puntos = miles, coma = decimal ("1.200,50" → 1200.50)
      s = s.replace(/\./g, "").replace(",", ".").replace(/[^0-9.\-]/g, "");
    } else if (/\.\d{3}$/.test(s)) {
      // sin coma y punto con 3 decimales finales = miles ("1.200" → 1200)
      s = s.replace(/\./g, "");
    }
    var n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  function fmtMonto(v) {
    var n = toNum(v);
    if (n == null) return v == null ? "" : String(v);
    return n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  /** Acepta dd/MM/yyyy (lo que devuelve el motor) e ISO. */
  function parseFecha(v) {
    if (v == null || v === "") return null;
    if (Object.prototype.toString.call(v) === "[object Date]") return v;
    var s = String(v).trim();
    var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1], 12);
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function setStatus(msg, kind) {
    var el = $("status");
    el.textContent = msg || "";
    el.className = "status" + (kind ? " " + kind : "");
  }
})();
