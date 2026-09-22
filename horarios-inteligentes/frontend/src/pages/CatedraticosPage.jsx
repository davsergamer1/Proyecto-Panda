import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Users, Plus, Edit2, Trash2, X, BookOpen, ShieldCheck, Key, UserPlus, Shield, CheckCircle, AlertCircle } from "lucide-react";

export default function CatedraticosPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("docentes"); // 'docentes' | 'usuarios'

  const [catedraticos, setCatedraticos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [habilitaciones, setHabilitaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Catedrático
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    carga_min: 2,
    carga_max: 10
  });

  // Modal Habilitación (Catedrático - Curso)
  const [showHabModal, setShowHabModal] = useState(false);
  const [habForm, setHabForm] = useState({
    catedratico_id: "",
    curso_id: ""
  });

  // Modal Crear Usuario / Credenciales (Admin)
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "docente",
    catedratico_id: ""
  });
  const [userSuccessMsg, setUserSuccessMsg] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [catData, curData, habData, usrData] = await Promise.all([
        api.getCatedraticos(),
        api.getCursos(),
        api.getCatedraticosCursos(),
        api.getUsuarios().catch(() => [])
      ]);
      setCatedraticos(catData || []);
      setCursos(curData || []);
      setHabilitaciones(habData || []);
      setUsuarios(usrData || []);
    } catch (err) {
      setErrorMsg("Error al cargar datos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers Catedrático
  const handleOpenCreate = () => {
    setEditingCat(null);
    setFormData({ nombre: "", carga_min: 2, carga_max: 10 });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCat(c);
    setFormData({
      nombre: c.nombre,
      carga_min: c.carga_min,
      carga_max: c.carga_max
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setErrorMsg("El nombre del catedrático es obligatorio");
      return;
    }
    if (formData.carga_min > formData.carga_max) {
      setErrorMsg("La carga mínima no puede ser mayor que la máxima");
      return;
    }
    try {
      if (editingCat) {
        await api.updateCatedratico(editingCat.id, formData);
      } else {
        await api.createCatedratico(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Desea eliminar este catedrático?")) return;
    try {
      await api.deleteCatedratico(id);
      loadData();
    } catch (err) {
      alert("Error al eliminar catedrático: " + err.message);
    }
  };

  // Handlers Habilitación
  const handleOpenHabModal = (catedraticoId = "") => {
    setHabForm({
      catedratico_id: catedraticoId || (catedraticos[0]?.id || ""),
      curso_id: cursos[0]?.id || ""
    });
    setErrorMsg("");
    setShowHabModal(true);
  };

  const handleSaveHab = async (e) => {
    e.preventDefault();
    if (!habForm.catedratico_id || !habForm.curso_id) {
      setErrorMsg("Seleccione un catedrático y un curso");
      return;
    }
    try {
      await api.createCatedraticoCurso(habForm);
      setShowHabModal(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteHab = async (id) => {
    try {
      await api.deleteCatedraticoCurso(id);
      loadData();
    } catch (err) {
      alert("Error al remover cualificación: " + err.message);
    }
  };

  // Handlers Creación de Usuario / Credenciales por Admin
  const handleOpenCreateUser = (catedratico = null) => {
    setUserSuccessMsg("");
    setErrorMsg("");
    setUserForm({
      nombre: catedratico ? catedratico.nombre : "",
      email: catedratico ? `${catedratico.nombre.toLowerCase().replace(/[^a-z0-9]/g, "")}@umg.edu.gt` : "",
      password: "",
      rol: "docente",
      catedratico_id: catedratico ? catedratico.id : (catedraticos[0]?.id || "")
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userForm.nombre || !userForm.email || !userForm.password) {
      setErrorMsg("Ingrese nombre, email y contraseña inicial.");
      return;
    }
    try {
      setErrorMsg("");
      await api.register(userForm);
      setUserSuccessMsg("¡Cuenta de usuario creada con éxito!");
      setTimeout(() => {
        setShowUserModal(false);
        setUserSuccessMsg("");
        loadData();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("¿Desea eliminar las credenciales de este usuario?")) return;
    try {
      await api.deleteUsuario(id);
      loadData();
    } catch (err) {
      alert("Error al revocar acceso: " + err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header Bar */}
      <div className="header-responsive" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Docentes y Gestión de Cuentas</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Administración del cuerpo docente, restricción de carga académica y asignación de credenciales de acceso.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {isAdmin && (
            <>
              <button className="btn btn-primary" onClick={() => handleOpenCreateUser()}>
                <Key style={{ width: "18px" }} /> Crear Usuario y Contraseña
              </button>
              <button className="btn btn-secondary" onClick={() => handleOpenHabModal()}>
                <ShieldCheck style={{ width: "18px" }} /> Asignar Curso Habilitado
              </button>
              <button className="btn btn-secondary" onClick={handleOpenCreate}>
                <Plus style={{ width: "18px" }} /> Nuevo Catedrático
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Administrator View */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
        <button
          className={`btn ${activeTab === "docentes" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("docentes")}
        >
          <Users style={{ width: "18px" }} /> Cuerpo Docente ({catedraticos.length})
        </button>
        {isAdmin && (
          <button
            className={`btn ${activeTab === "usuarios" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("usuarios")}
          >
            <Key style={{ width: "18px" }} /> Credenciales y Accesos Supabase ({usuarios.length})
          </button>
        )}
      </div>

      {activeTab === "docentes" && (
        <>
          {/* KPI Summary Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-box kpi-icon-indigo">
                <Users style={{ width: "24px" }} />
              </div>
              <div>
                <div className="kpi-label">Cuerpo Docente</div>
                <div className="kpi-value">{catedraticos.length}</div>
                <div className="kpi-subtext">Catedráticos registrados</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-box kpi-icon-cyan">
                <ShieldCheck style={{ width: "24px" }} />
              </div>
              <div>
                <div className="kpi-label">Cualificaciones Habilitadas</div>
                <div className="kpi-value">{habilitaciones.length}</div>
                <div className="kpi-subtext">Asignaciones docente-curso</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-box kpi-icon-emerald">
                <Users style={{ width: "24px" }} />
              </div>
              <div>
                <div className="kpi-label">Carga Máxima Promedio</div>
                <div className="kpi-value">
                  {catedraticos.length > 0 
                    ? Math.round(catedraticos.reduce((sum, c) => sum + (c.carga_max || 0), 0) / catedraticos.length) 
                    : 0} h
                </div>
                <div className="kpi-subtext">Periodos semanales/profesor</div>
              </div>
            </div>
          </div>

          {/* Table Container Catedráticos */}
          <div className="glass-panel" style={{ padding: "1rem" }}>
            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                Cargando registros docentes...
              </div>
            ) : catedraticos.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                No hay catedráticos registrados.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Catedrático / Profesor</th>
                      <th>Carga Académica (Min - Máx)</th>
                      <th>Cursos Habilitados</th>
                      <th>Estado de Acceso</th>
                      {isAdmin && <th style={{ textAlign: "right" }}>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {catedraticos.map((cat) => {
                      const misHab = habilitaciones.filter(h => h.catedratico_id === cat.id);
                      const tieneUsuario = usuarios.find(u => u.catedratico_id === cat.id);

                      return (
                        <tr key={cat.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: "600" }}>
                              <Users style={{ width: "18px", color: "var(--primary)" }} />
                              {cat.nombre}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-warning">
                              {cat.carga_min} a {cat.carga_max} periodos/semana
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                              {misHab.map((h) => (
                                <span key={h.id} className="badge badge-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                                  {h.cursos?.nombre || "Curso"}
                                  {isAdmin && (
                                    <X 
                                      style={{ width: "12px", cursor: "pointer", marginLeft: "4px" }} 
                                      onClick={() => handleDeleteHab(h.id)}
                                    />
                                  )}
                                </span>
                              ))}
                              {isAdmin && (
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: "0.15rem 0.4rem", fontSize: "0.7rem" }}
                                  onClick={() => handleOpenHabModal(cat.id)}
                                >
                                  + Agregar
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            {tieneUsuario ? (
                              <span className="badge badge-success" style={{ fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                <Key style={{ width: "12px" }} /> {tieneUsuario.email}
                              </span>
                            ) : (
                              <span className="badge" style={{ background: "rgba(107, 114, 128, 0.15)", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                Sin Cuenta
                              </span>
                            )}
                          </td>
                          {isAdmin && (
                            <td style={{ textAlign: "right" }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenCreateUser(cat)}
                                style={{ marginRight: "0.5rem" }}
                                title="Crear/Asignar usuario y contraseña para este catedrático"
                              >
                                <Key style={{ width: "14px", color: "var(--primary)" }} /> Credenciales
                              </button>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(cat)} style={{ marginRight: "0.5rem" }}>
                                <Edit2 style={{ width: "14px" }} /> Editar
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat.id)}>
                                <Trash2 style={{ width: "14px" }} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "usuarios" && isAdmin && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Cuentas de Acceso y Credenciales</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.2rem 0 0" }}>
                Usuarios autenticados en Supabase con acceso al sistema (Administradores y Catedráticos Docentes).
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenCreateUser()}>
              <UserPlus style={{ width: "16px" }} /> Nueva Cuenta
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo Electrónico</th>
                  <th>Rol de Acceso</th>
                  <th>Catedrático Vinculado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                      No se encontraron usuarios en Supabase (ejecute la creación de la tabla usuarios o registre uno nuevo).
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u) => {
                    const catVinculado = catedraticos.find(c => c.id === u.catedratico_id);
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: "600" }}>{u.nombre}</td>
                        <td>{u.email}</td>
                        <td>
                          {u.rol === "admin" ? (
                            <span className="badge badge-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              <Shield style={{ width: "12px" }} /> Administrador
                            </span>
                          ) : (
                            <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              <Users style={{ width: "12px" }} /> Docente
                            </span>
                          )}
                        </td>
                        <td>{catVinculado ? catVinculado.nombre : "-"}</td>
                        <td style={{ textAlign: "right" }}>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id)}>
                            <Trash2 style={{ width: "14px" }} /> Revocar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Catedrático */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingCat ? "Editar Catedrático" : "Nuevo Catedrático"}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X style={{ width: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: "#fca5a5", marginBottom: "1rem" }}>{errorMsg}</div>}
                
                <div className="form-group">
                  <label className="form-label">Nombre del Catedrático / Profesor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Ing. Carlos Pérez"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Carga Mínima (Horas)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={formData.carga_min}
                      onChange={(e) => setFormData({ ...formData, carga_min: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Carga Máxima (Horas)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={formData.carga_max}
                      onChange={(e) => setFormData({ ...formData, carga_max: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Habilitación */}
      {showHabModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Habilitar Catedrático para Curso</h3>
              <button onClick={() => setShowHabModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X style={{ width: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleSaveHab}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: "#fca5a5", marginBottom: "1rem" }}>{errorMsg}</div>}
                
                <div className="form-group">
                  <label className="form-label">Catedrático</label>
                  <select
                    className="form-select"
                    value={habForm.catedratico_id}
                    onChange={(e) => setHabForm({ ...habForm, catedratico_id: e.target.value })}
                  >
                    <option value="">-- Seleccionar Catedrático --</option>
                    {catedraticos.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Curso Habilitado</label>
                  <select
                    className="form-select"
                    value={habForm.curso_id}
                    onChange={(e) => setHabForm({ ...habForm, curso_id: e.target.value })}
                  >
                    <option value="">-- Seleccionar Curso --</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowHabModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Habilitar Curso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Admin Crear Credenciales de Usuario */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Key style={{ width: "20px", color: "var(--primary)" }} /> Crear Credenciales de Usuario
              </h3>
              <button onClick={() => setShowUserModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X style={{ width: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                {errorMsg && (
                  <div style={{ padding: "0.6rem", borderRadius: "var(--radius-sm)", background: "rgba(220, 38, 38, 0.12)", color: "var(--danger)", fontSize: "0.82rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <AlertCircle style={{ width: "16px" }} /> {errorMsg}
                  </div>
                )}
                {userSuccessMsg && (
                  <div style={{ padding: "0.6rem", borderRadius: "var(--radius-sm)", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontSize: "0.82rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <CheckCircle style={{ width: "16px" }} /> {userSuccessMsg}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nombre Completo del Usuario</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Ing. Mario Rossi"
                    value={userForm.nombre}
                    onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico (Login)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="mario.rossi@umg.edu.gt"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contraseña Inicial</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rol de Acceso</label>
                  <select
                    className="form-select"
                    value={userForm.rol}
                    onChange={(e) => setUserForm({ ...userForm, rol: e.target.value })}
                  >
                    <option value="docente">👨‍🏫 Catedrático Docente</option>
                    <option value="admin">🛡️ Administrador del Sistema</option>
                  </select>
                </div>

                {userForm.rol === "docente" && (
                  <div className="form-group">
                    <label className="form-label">Catedrático a Vincular</label>
                    <select
                      className="form-select"
                      value={userForm.catedratico_id}
                      onChange={(e) => setUserForm({ ...userForm, catedratico_id: e.target.value })}
                    >
                      <option value="">-- Crear Nuevo Catedrático Automáticamente --</option>
                      {catedraticos.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  <UserPlus style={{ width: "16px" }} /> Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

