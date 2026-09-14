"""
Modelo de optimización de horarios académicos.
Variable de decisión: x[c,p,a,t] -> 1 si la sección c es impartida
por el catedrático p, en el aula a, durante el bloque t.

Incluye la restricción secundaria de minimización de horas muertas
(sección 6.1 del documento de modelado) además de la maximización
de preferencias (6.2).
"""
from collections import defaultdict
from pulp import LpProblem, LpMinimize, LpVariable, lpSum, LpBinary, PULP_CBC_CMD
from data_loader import cargar_datos

w1, w2 = 1, 1  # pesos: w1 = horas muertas, w2 = preferencias


def construir_y_resolver(secciones, catedraticos, aulas, bloques, disponibilidad, preferencias, califica):
    modelo = LpProblem("Horarios_Academicos", LpMinimize)

    x = {
        (c, p, a, t): LpVariable(f"x_{c}_{p}_{a}_{t}", cat=LpBinary)
        for c in secciones for p in catedraticos for a in aulas for t in bloques
    }

    # ---------- 5.1 a 5.8: restricciones duras (igual que antes) ----------

    for c in secciones:
        modelo += lpSum(x[c, p, a, t] for p in catedraticos for a in aulas for t in bloques) \
            == secciones[c]["horas"], f"cobertura_{c}"

    for p in catedraticos:
        for t in bloques:
            modelo += lpSum(x[c, p, a, t] for c in secciones for a in aulas) <= 1, \
                f"no_solapa_catedratico_{p}_{t}"

    for a in aulas:
        for t in bloques:
            modelo += lpSum(x[c, p, a, t] for c in secciones for p in catedraticos) <= 1, \
                f"no_solapa_aula_{a}_{t}"

    for c in secciones:
        for p in catedraticos:
            for a in aulas:
                cap_aula = aulas[a]["capacidad"] if isinstance(aulas[a], dict) else aulas[a]
                for t in bloques:
                    modelo += secciones[c]["estudiantes"] * x[c, p, a, t] <= cap_aula, \
                        f"capacidad_{c}_{p}_{a}_{t}"

    # Restricciones de equipamiento físico especial (cañonera, escritorio, pizarra)
    for c in secciones:
        req_canonera = secciones[c].get("requiere_canonera", False)
        req_escritorio = secciones[c].get("requiere_escritorio", False)
        req_pizarra = secciones[c].get("requiere_pizarra", False)
        for a in aulas:
            aula_info = aulas[a] if isinstance(aulas[a], dict) else {}
            cumple_canonera = (not req_canonera) or aula_info.get("tiene_canonera", True)
            cumple_escritorio = (not req_escritorio) or aula_info.get("tiene_escritorio", True)
            cumple_pizarra = (not req_pizarra) or aula_info.get("tiene_pizarra", True)

            if not (cumple_canonera and cumple_escritorio and cumple_pizarra):
                for p in catedraticos:
                    for t in bloques:
                        modelo += x[c, p, a, t] == 0, f"sin_equipamiento_{c}_{p}_{a}_{t}"

    for c in secciones:
        for p in catedraticos:
            for a in aulas:
                for t in bloques:
                    modelo += x[c, p, a, t] <= disponibilidad.get((p, t), 0), \
                        f"disponibilidad_{c}_{p}_{a}_{t}"

    mallas = set(s["malla"] for s in secciones.values())
    for m in mallas:
        secciones_malla = [c for c in secciones if secciones[c]["malla"] == m]
        for t in bloques:
            modelo += lpSum(x[c, p, a, t] for c in secciones_malla
                             for p in catedraticos for a in aulas) <= 1, \
                f"no_cruce_malla_{m}_{t}"

    total_horas_demandadas = sum(s["horas"] for s in secciones.values())
    total_carga_min_solicitada = sum(c["carga_min"] for c in catedraticos.values())

    factor_escalamiento = 1.0
    if total_carga_min_solicitada > total_horas_demandadas and total_carga_min_solicitada > 0:
        factor_escalamiento = total_horas_demandadas / total_carga_min_solicitada

    for p in catedraticos:
        cursos_que_imparte = [c_id for (p_id, c_id), v in califica.items() if p_id == p and v == 1]
        secciones_que_imparte = [s_id for s_id, s_info in secciones.items() if s_info["curso"] in cursos_que_imparte]
        max_horas_posibles = sum(secciones[s_id]["horas"] for s_id in secciones_que_imparte)
        avail_slots_p = sum(disponibilidad.get((p, t), 0) for t in bloques)
        
        min_base = int(catedraticos[p]["carga_min"] * factor_escalamiento)
        min_requerido = min(min_base, max_horas_posibles, avail_slots_p)

        total_p = lpSum(x[c, p, a, t] for c in secciones for a in aulas for t in bloques)
        if min_requerido > 0:
            modelo += total_p >= min_requerido, f"carga_min_{p}"
        modelo += total_p <= catedraticos[p]["carga_max"], f"carga_max_{p}"

    for c in secciones:
        curso_c = secciones[c]["curso"]
        for p in catedraticos:
            if califica.get((p, curso_c), 0) == 0:
                for a in aulas:
                    for t in bloques:
                        modelo += x[c, p, a, t] == 0, f"no_habilitado_{c}_{p}_{a}_{t}"

    # ---------- 6.1 Horas muertas: variables auxiliares ----------

    # Agrupar bloques por día, ordenados cronológicamente dentro de cada día
    bloques_por_dia = defaultdict(list)
    for t in bloques:
        dia = t.split("_")[0]
        bloques_por_dia[dia].append(t)
    for dia in bloques_por_dia:
        bloques_por_dia[dia].sort()

    # ocup[p,t] = 1 si el catedrático p tiene clase en el bloque t
    ocup = {(p, t): LpVariable(f"ocup_{p}_{t}", cat=LpBinary) for p in catedraticos for t in bloques}
    for p in catedraticos:
        for t in bloques:
            modelo += ocup[p, t] == lpSum(x[c, p, a, t] for c in secciones for a in aulas), \
                f"ocupacion_{p}_{t}"

    huecos = []
    for p in catedraticos:
        for dia, lista in bloques_por_dia.items():
            n = len(lista)

            # pref[k] = 1 si hay alguna clase ANTES de la posición k, ese día
            pref = {}
            pref[0] = 0  # antes del primer bloque del día, no hay nada
            for k in range(1, n):
                var = LpVariable(f"pref_{p}_{dia}_{k}", cat=LpBinary)
                t_prev = lista[k - 1]
                modelo += var >= ocup[p, t_prev], f"pref_ge_ocup_{p}_{dia}_{k}"
                if isinstance(pref[k - 1], LpVariable):
                    modelo += var >= pref[k - 1], f"pref_ge_prev_{p}_{dia}_{k}"
                    modelo += var <= ocup[p, t_prev] + pref[k - 1], f"pref_le_{p}_{dia}_{k}"
                else:
                    modelo += var <= ocup[p, t_prev] + pref[k - 1], f"pref_le_{p}_{dia}_{k}"
                pref[k] = var

            # suf[k] = 1 si hay alguna clase DESPUÉS de la posición k, ese día
            suf = {}
            suf[n - 1] = 0  # después del último bloque del día, no hay nada
            for k in range(n - 2, -1, -1):
                var = LpVariable(f"suf_{p}_{dia}_{k}", cat=LpBinary)
                t_next = lista[k + 1]
                modelo += var >= ocup[p, t_next], f"suf_ge_ocup_{p}_{dia}_{k}"
                if isinstance(suf[k + 1], LpVariable):
                    modelo += var >= suf[k + 1], f"suf_ge_next_{p}_{dia}_{k}"
                    modelo += var <= ocup[p, t_next] + suf[k + 1], f"suf_le_{p}_{dia}_{k}"
                else:
                    modelo += var <= ocup[p, t_next] + suf[k + 1], f"suf_le_{p}_{dia}_{k}"
                suf[k] = var

            # hueco[k] = 1 si hay clase antes Y después, pero este bloque está libre
            for k, t in enumerate(lista):
                h = LpVariable(f"hueco_{p}_{t}", cat=LpBinary)
                antes = pref[k]
                despues = suf[k]
                modelo += h <= antes if isinstance(antes, LpVariable) else h <= 0
                modelo += h <= despues if isinstance(despues, LpVariable) else h <= 0
                modelo += h <= 1 - ocup[p, t], f"hueco_le_libre_{p}_{t}"
                antes_expr = antes if isinstance(antes, LpVariable) else 0
                despues_expr = despues if isinstance(despues, LpVariable) else 0
                modelo += h >= antes_expr + despues_expr - ocup[p, t] - 1, f"hueco_ge_{p}_{t}"
                huecos.append(h)

    # ---------- 6.2 y 6.3: función objetivo completa ----------
    w3 = 10  # peso para maximizar equidad y participación de catedráticos
    w4 = 5   # peso para equilibrar y utilizar distintas aulas físicas disponibles
    w5 = 8   # peso para consistencia (que la misma sección se imparta en la misma aula)

    profesores_activos = []
    for p in catedraticos:
        act = LpVariable(f"activo_{p}", cat=LpBinary)
        total_p = lpSum(x[c, p, a, t] for c in secciones for a in aulas for t in bloques)
        modelo += total_p >= act, f"activacion_{p}"
        profesores_activos.append(act)
    equidad_docente = lpSum(profesores_activos)

    aulas_activas = []
    for a in aulas:
        act_a = LpVariable(f"aula_activa_{a}", cat=LpBinary)
        total_a = lpSum(x[c, p, a, t] for c in secciones for p in catedraticos for t in bloques)
        modelo += total_a >= act_a, f"activacion_aula_{a}"
        aulas_activas.append(act_a)
    distribucion_aulas = lpSum(aulas_activas)

    consistencia_aulas = []
    for c in secciones:
        horas_req = secciones[c]["horas"]
        for a in aulas:
            same_a = LpVariable(f"same_aula_{c}_{a}", cat=LpBinary)
            modelo += lpSum(x[c, p, a, t] for p in catedraticos for t in bloques) >= horas_req * same_a, f"consist_{c}_{a}"
            consistencia_aulas.append(same_a)
    consistencia_total = lpSum(consistencia_aulas)

    preferencias_totales = lpSum(
        x[c, p, a, t] * preferencias.get((p, t), 0)
        for c in secciones for p in catedraticos for a in aulas for t in bloques
    )
    huecos_totales = lpSum(huecos)

    modelo += w1 * huecos_totales - w2 * preferencias_totales - w3 * equidad_docente - w4 * distribucion_aulas - w5 * consistencia_total, "funcion_objetivo"

    modelo.solve(PULP_CBC_CMD(msg=False))
    return modelo, x


if __name__ == "__main__":
    secciones, catedraticos, aulas, bloques, disponibilidad, preferencias, califica = cargar_datos()

    if not secciones or not aulas or not bloques or not califica:
        print("⚠️  Faltan datos en Supabase (secciones, aulas, disponibilidad o catedraticos_cursos vacíos).")
    else:
        modelo, x = construir_y_resolver(secciones, catedraticos, aulas, bloques, disponibilidad, preferencias, califica)
        estado = {1: "Óptima", 0: "No resuelta", -1: "Infactible"}.get(modelo.status, "?")
        print(f"\nEstado de la solución: {estado}\n")

        if estado == "Óptima":
            from data_loader import supabase
            nombres_catedraticos = {c["id"]: c["nombre"] for c in supabase.table("catedraticos").select("id, nombre").execute().data}
            nombres_aulas = {a["id"]: a["nombre"] for a in supabase.table("aulas").select("id, nombre").execute().data}
            nombres_cursos = {s["id"]: s["cursos"]["nombre"] for s in supabase.table("secciones").select("id, cursos(nombre)").execute().data}

            print("Asignaciones encontradas:")
            for (c, p, a, t), var in x.items():
                if var.value() == 1:
                    print(f"  {nombres_cursos.get(c, c)} -> {nombres_catedraticos.get(p, p)}, "
                          f"Aula {nombres_aulas.get(a, a)}, Bloque {t}")
        else:
            print("El modelo no encontró una solución óptima con los datos actuales.")