"""
Orquesta la optimización completa: carga datos, resuelve el modelo
y guarda el horario resultante en la tabla horarios_generados.
"""
from data_loader import cargar_datos, supabase
from model import construir_y_resolver


def limpiar_horario_anterior():
    """Borra el horario generado previamente antes de guardar uno nuevo."""
    supabase.table("horarios_generados").delete().neq(
        "id", "00000000-0000-0000-0000-000000000000"
    ).execute()


def guardar_resultado(x):
    """Inserta en horarios_generados cada asignación que el modelo activó."""
    filas = []
    for (c, p, a, t), var in x.items():
        if var.value() == 1:
            dia, bloque_inicio = t.split("_", 1)
            filas.append({
                "seccion_id": c,
                "catedratico_id": p,
                "aula_id": a,
                "dia": dia,
                "bloque": bloque_inicio,
            })

    if not filas:
        print("[WARNING] No hay asignaciones para guardar.")
        return 0

    supabase.table("horarios_generados").insert(filas).execute()
    return len(filas)


import sys

def ejecutar_optimizacion():
    print("Cargando datos desde Supabase...")
    secciones, catedraticos, aulas, bloques, disponibilidad, preferencias, califica = cargar_datos()

    if not secciones or not aulas or not bloques or not califica:
        print("[ERROR] Faltan datos necesarios en Supabase (secciones, aulas, disponibilidad o cualificaciones vacías).")
        sys.exit(1)

    print(f"Resolviendo modelo ({len(secciones)} secciones, {len(catedraticos)} catedráticos, "
          f"{len(aulas)} aulas, {len(bloques)} bloques horarios)...")
    modelo, x = construir_y_resolver(secciones, catedraticos, aulas, bloques, disponibilidad, preferencias, califica)

    estado = {1: "Óptima", 0: "No resuelta", -1: "Infactible"}.get(modelo.status, "Desconocido")
    print(f"Estado de la solución: {estado}")

    if estado != "Óptima":
        print(f"[ERROR] No se pudo generar el horario. El modelo no encontró una solución óptima (Estado: {estado}).")
        
        # 1. Cursos sin docentes calificados o con disponibilidad insuficiente
        for c_id, s_info in secciones.items():
            curso_id = s_info["curso"]
            profes_calificados = [p_id for (p_id, cur_id), v in califica.items() if cur_id == curso_id and v == 1]
            if not profes_calificados:
                print(f"[DIAGNÓSTICO] El curso '{s_info['nombre_curso']}' NO tiene ningún catedrático calificado asignado.")
            else:
                bloques_disponibles = set()
                for p_id in profes_calificados:
                    for t in bloques:
                        if disponibilidad.get((p_id, t), 0) == 1:
                            bloques_disponibles.add(t)
                if len(bloques_disponibles) < s_info["horas"]:
                    print(f"[DIAGNÓSTICO] El curso '{s_info['nombre_curso']}' requiere {s_info['horas']} horas, pero sus docentes calificados solo suman {len(bloques_disponibles)} bloques disponibles.")

        # 2. Carga demandada vs disponibilidad por catedrático que es único docente calificado
        for p_id, p_info in catedraticos.items():
            cursos_unicos = []
            for c_id, s_info in secciones.items():
                curso_id = s_info["curso"]
                profs = [p for (p, cur), v in califica.items() if cur == curso_id and v == 1]
                if profs == [p_id]:
                    cursos_unicos.append(s_info)
            if cursos_unicos:
                horas_requeridas = sum(s["horas"] for s in cursos_unicos)
                slots_docente = sum(disponibilidad.get((p_id, t), 0) for t in bloques)
                if slots_docente < horas_requeridas:
                    nombres = ", ".join(s["nombre_curso"] for s in cursos_unicos)
                    print(f"[DIAGNÓSTICO] Un catedrático es el único calificado para: '{nombres}' ({horas_requeridas}h requeridas), pero solo tiene {slots_docente} bloques de disponibilidad guardados.")

        sys.exit(1)

    print("Limpiando horario anterior...")
    limpiar_horario_anterior()

    print("Guardando nuevo horario en Supabase...")
    total = guardar_resultado(x)
    print(f"[OK] {total} asignaciones guardadas exitosamente en la base de datos.")


if __name__ == "__main__":
    ejecutar_optimizacion()