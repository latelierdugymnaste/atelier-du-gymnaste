// app/api/expenses/import/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import * as XLSX from 'xlsx'

// Mapper la catégorie de l'Excel vers les catégories de la base de données
function mapCategory(entreprise: string): string {
  const normalized = entreprise?.toLowerCase().trim() || ''

  if (normalized.includes('agiva') || normalized.includes('sport')) {
    return 'AGIVA_SPORT'
  }
  if (normalized.includes('logistique') || normalized.includes('douane')) {
    return 'LOGISTIQUE'
  }
  if (normalized.includes('production')) {
    return 'PRODUCTION'
  }
  if (normalized.includes('marketing')) {
    return 'MARKETING'
  }
  if (normalized.includes('stand')) {
    return 'STAND'
  }
  if (normalized.includes('pandacola') || normalized.includes('panda')) {
    return 'PANDACOLA'
  }

  return 'AUTRE'
}

// Parser la date Excel
function parseExcelDate(value: any): Date {
  if (!value) return new Date()

  // Si c'est déjà une date
  if (value instanceof Date) return value

  // Si c'est un nombre (format Excel)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    return new Date(date.y, date.m - 1, date.d)
  }

  // Si c'est une string
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) return parsed
  }

  return new Date()
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Lire le fichier Excel
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convertir en JSON
    const data = XLSX.utils.sheet_to_json(worksheet)

    const results = {
      success: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>,
    }

    // Traiter chaque ligne
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i]

      try {
        // Mapper les colonnes (avec plusieurs variantes possibles de noms)
        const date = parseExcelDate(
          row['Date'] || row['date'] || row['DATE']
        )

        const description =
          row['Description'] || row['description'] || row['DESCRIPTION'] || ''

        const amount = parseFloat(
          String(row['Coût total'] || row['Cout total'] || row['Montant'] || row['montant'] || 0)
            .replace(/[^0-9.-]/g, '')
        )

        const entreprise =
          row['Entreprise'] || row['entreprise'] || row['Catégorie'] || row['categorie'] || ''

        const invoiceUrl =
          row['Lien de la facture'] || row['Facture'] || row['Lien'] || null

        const notes =
          row['Notes'] || row['notes'] || ''

        // Construire la description finale
        let finalDescription = description
        if (notes) {
          finalDescription += ` - ${notes}`
        }

        if (!finalDescription || amount <= 0) {
          results.errors.push({
            row: i + 2, // +2 car ligne 1 = header, et index commence à 0
            error: 'Description ou montant invalide',
            data: row,
          })
          continue
        }

        const category = mapCategory(entreprise)

        // Créer la dépense
        await prisma.expense.create({
          data: {
            date,
            amount,
            category,
            description: finalDescription,
            invoiceUrl: invoiceUrl || null,
          },
        })

        results.success++
      } catch (error: any) {
        results.errors.push({
          row: i + 2,
          error: error.message || 'Erreur inconnue',
          data: row,
        })
      }
    }

    return NextResponse.json({
      message: `Import terminé: ${results.success} dépenses importées, ${results.errors.length} erreurs`,
      success: results.success,
      errors: results.errors,
    })
  } catch (error: any) {
    console.error('Erreur import:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'import du fichier: ' + error.message },
      { status: 500 }
    )
  }
}
