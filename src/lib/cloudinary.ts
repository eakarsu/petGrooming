import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(
  buffer: Buffer,
  filename: string,
  folder = 'pet-grooming'
): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> {
  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename.replace(/\.[^/.]+$/, ''), // strip extension
        resource_type: 'image',
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          const msg = error?.message ?? 'Cloudinary upload failed'
          console.error('Cloudinary upload error:', msg)
          resolve({ success: false, error: msg })
        } else {
          resolve({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
          })
        }
      }
    )
    uploadStream.end(buffer)
  })
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (err) {
    console.error('Cloudinary delete error:', err)
    return false
  }
}
