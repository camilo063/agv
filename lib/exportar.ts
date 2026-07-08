import ExcelJS from 'exceljs'

/**
 * Exportación de tablas (HU-11.5: "CSV/Excel"). Genera la Response en el
 * formato pedido a partir de cabecera + filas (strings ya resueltos).
 *  - csv  (defecto): con BOM UTF-8 (abre bien en Excel es-CO).
 *  - xlsx: hoja con cabecera en verde AGV y auto-ancho básico.
 */
export async function responderExport(
  nombreArchivo: string,
  cabecera: string[],
  filas: string[][],
  formato: string | undefined,
): Promise<Response> {
  if (formato === 'xlsx') {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Datos')
    ws.addRow(cabecera)
    const head = ws.getRow(1)
    head.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF69961F' } }
    for (const f of filas) ws.addRow(f)
    ws.columns.forEach((col, i) => {
      const anchos = [cabecera[i]?.length ?? 10, ...filas.map((f) => (f[i] ?? '').length)]
      col.width = Math.min(40, Math.max(12, Math.max(...anchos) + 2))
    })
    const buffer = await wb.xlsx.writeBuffer()
    return new Response(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}.xlsx"`,
      },
    })
  }

  const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)
  const csv = [cabecera.join(','), ...filas.map((f) => f.map(esc).join(','))].join('\n')
  return new Response(`﻿${csv}`, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombreArchivo}.csv"`,
    },
  })
}
