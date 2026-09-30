import { supabase } from '../config/supabase'
import crypto from 'crypto'

const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'storage'

export async function uploadImage(dataUriOrUrl: string): Promise<string> {
  if (dataUriOrUrl.startsWith('http://') || dataUriOrUrl.startsWith('https://')) {
    return dataUriOrUrl
  }

  const matches = dataUriOrUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Formato de imagen inválido. Debe ser una Data URI base64 válida.')
  }

  const mimeType = matches[1]
  const base64Data = matches[2]
  const buffer = Buffer.from(base64Data, 'base64')

  const ext = mimeType.split('/')[1] || 'jpeg'
  const filename = `subproductos/${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`

  let targetBucket = BUCKET_NAME
  let { data, error } = await supabase.storage
    .from(targetBucket)
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (error && error.message.includes('Bucket not found')) {
    targetBucket = 'Imagenes'
    const retry = await supabase.storage
      .from(targetBucket)
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: true,
      })
    data = retry.data
    error = retry.error
  }

  if (error || !data) {
    console.error('Error al subir imagen a Supabase Storage:', error)
    throw new Error(`Error al subir imagen a Storage: ${error?.message || 'Error desconocido'}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from(targetBucket)
    .getPublicUrl(data.path)

  return publicUrlData.publicUrl
}

export async function deleteImage(publicUrl: string): Promise<void> {
  if (!publicUrl) return

  try {
    const urlObj = new URL(publicUrl)
    const buckets = ['storage', 'Imagenes']
    for (const bucket of buckets) {
      if (publicUrl.includes(bucket)) {
        const pathParts = urlObj.pathname.split(`${bucket}/`)
        if (pathParts.length > 1) {
          const filePath = pathParts[1]
          await supabase.storage.from(bucket).remove([filePath])
          break
        }
      }
    }
  } catch (err) {
    console.error('Error al eliminar imagen de Supabase Storage:', err)
  }
}
