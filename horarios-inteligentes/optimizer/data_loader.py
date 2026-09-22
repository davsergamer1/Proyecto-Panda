import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])


def norm_dia(d):
    if not d: return ""
    upper = str(d).upper().strip()
    if upper.startswith("LUN"): return "Lunes"
    if upper.startswith("MAR"): return "Martes"
    if upper.startswith("MIE"): return "Miércoles"
    if upper.startswith("JUE"): return "Jueves"
    if upper.startswith("VIE"): return "Viernes"
    if upper.startswith("SAB"): return "Sábado"
    return d


def norm_bloque(b):
    if not b: return ""
    str_b = str(b).strip()
    if len(str_b) <= 2: return str_b.zfill(2) + ":00"
    if ":" in str_b: return str_b[:5]
    return str_b


def infer_requerimientos(nombre_curso):
    nombre = (nombre_curso or "").lower()
    req_canonera = any(k in nombre for k in ["ia", "inteligencia", "laboratorio", "programac", "redes", "sistemas", "computac", "proyect", "operaciones", "datos"])
    req_escritorio = any(k in nombre for k in ["ia", "inteligencia", "laboratorio", "programac", "sistemas", "datos"])
    req_pizarra = True
    return req_canonera, req_escritorio, req_pizarra


def cargar_datos():
    # Secciones, con su curso (horas, malla, nombre)
    secciones_raw = supabase.table("secciones") \
        .select("id, cupo, cursos(id, nombre, horas_semana, malla_id)") \
        .execute().data

    secciones = {}
    for s in secciones_raw:
        curso_info = s.get("cursos", {}) or {}
        nombre_c = curso_info.get("nombre", "")
        req_can, req_esc, req_piz = infer_requerimientos(nombre_c)

        secciones[s["id"]] = {
            "curso": curso_info.get("id"),
            "nombre_curso": nombre_c,
            "horas": curso_info.get("horas_semana", 2),
            "estudiantes": s.get("cupo", 25),
            "malla": curso_info.get("malla_id"),
            "requiere_canonera": curso_info.get("requiere_canonera", req_can),
            "requiere_escritorio": curso_info.get("requiere_escritorio", req_esc),
            "requiere_pizarra": curso_info.get("requiere_pizarra", req_piz),
        }

    # Catedráticos
    catedraticos_raw = supabase.table("catedraticos").select("*").execute().data
    catedraticos = {
        c["id"]: {"carga_min": c["carga_min"], "carga_max": c["carga_max"]}
        for c in catedraticos_raw
    }

    # Aulas (capacidad y recursos físicos)
    aulas_raw = supabase.table("aulas").select("*").execute().data
    aulas = {
        a["id"]: {
            "capacidad": a["capacidad"],
            "tiene_canonera": a.get("tiene_canonera", True),
            "tiene_escritorio": a.get("tiene_escritorio", True),
            "tiene_pizarra": a.get("tiene_pizarra", True),
        }
        for a in aulas_raw
    }

    # Disponibilidad + preferencia -> también arma el conjunto de bloques
    disp_raw = supabase.table("disponibilidad").select("*").execute().data
    disponibilidad, preferencias, bloques_set = {}, {}, set()

    DEFAULT_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    DEFAULT_BLOQUES = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "17:00", "18:00", "19:00", "20:00"]
    for d_item in DEFAULT_DIAS:
        for b_item in DEFAULT_BLOQUES:
            bloques_set.add(f"{d_item}_{b_item}")

    for d in (disp_raw or []):
        dia_norm = norm_dia(d.get("dia"))
        bloque_norm = norm_bloque(d.get("bloque_inicio"))
        bloque_key = f"{dia_norm}_{bloque_norm}"
        bloques_set.add(bloque_key)
        disponibilidad[(d["catedratico_id"], bloque_key)] = 1
        preferencias[(d["catedratico_id"], bloque_key)] = 1 if d.get("preferido") else 0
    bloques = sorted(bloques_set)

    # Si algún catedrático no tiene disponibilidad registrada, asignar disponibilidad completa por defecto
    for p_id in catedraticos:
        has_disp = any(k[0] == p_id for k in disponibilidad.keys())
        if not has_disp:
            for b_key in bloques:
                disponibilidad[(p_id, b_key)] = 1

    # Calificación catedrático-curso
    calif_raw = supabase.table("catedraticos_cursos").select("*").execute().data
    califica = {(c["catedratico_id"], c["curso_id"]): 1 for c in (calif_raw or [])}

    # Auto-sanación: Garantizar que cada curso tenga al menos un catedrático habilitado
    for s_id, s_info in secciones.items():
        curso_id = s_info.get("curso")
        if not curso_id:
            continue
        profs = [p for (p, cur), v in califica.items() if cur == curso_id and v == 1]
        if not profs and catedraticos:
            for p_id in catedraticos:
                califica[(p_id, curso_id)] = 1
                try:
                    supabase.table("catedraticos_cursos").insert({"catedratico_id": p_id, "curso_id": curso_id}).execute()
                except Exception:
                    pass

    return secciones, catedraticos, aulas, bloques, disponibilidad, preferencias, califica


if __name__ == "__main__":
    secciones, catedraticos, aulas, bloques, disponibilidad, preferencias, califica = cargar_datos()
    print(f"Cargado: {len(secciones)} secciones, {len(catedraticos)} catedráticos, "
          f"{len(aulas)} aulas, {len(bloques)} bloques, {len(califica)} calificaciones")