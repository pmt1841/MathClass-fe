export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      image.setAttribute('crossOrigin', 'anonymous')
    }
    image.src = url
  })

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Returns the cropped image file using HTML5 Canvas
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  fileName = 'cropped-avatar.jpg'
): Promise<File> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas context 2D unavailable')
  }

  const rotRad = getRadianAngle(rotation)

  // Calculate bounding box of the rotated image
  const bBoxWidth =
    Math.abs(Math.cos(rotRad) * image.width) +
    Math.abs(Math.sin(rotRad) * image.height)
  const bBoxHeight =
    Math.abs(Math.sin(rotRad) * image.width) +
    Math.abs(Math.cos(rotRad) * image.height)

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // Translate canvas center & rotate
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.translate(-image.width / 2, -image.height / 2)

  // Draw rotated image
  ctx.drawImage(image, 0, 0)

  // Create crop canvas with rounded integer dimensions to avoid sub-pixel blurring
  const safeCrop = {
    x: Math.round(pixelCrop.x),
    y: Math.round(pixelCrop.y),
    width: Math.round(pixelCrop.width),
    height: Math.round(pixelCrop.height),
  }

  const cropCanvas = document.createElement('canvas')
  const cropCtx = cropCanvas.getContext('2d')

  if (!cropCtx) {
    throw new Error('Crop canvas context 2D unavailable')
  }

  cropCanvas.width = safeCrop.width
  cropCanvas.height = safeCrop.height

  // Fill white background to handle PNG transparency when exporting to JPEG
  cropCtx.fillStyle = '#ffffff'
  cropCtx.fillRect(0, 0, cropCanvas.width, cropCanvas.height)

  cropCtx.drawImage(
    canvas,
    safeCrop.x,
    safeCrop.y,
    safeCrop.width,
    safeCrop.height,
    0,
    0,
    safeCrop.width,
    safeCrop.height
  )

  // Convert crop canvas to Blob and then File
  return new Promise((resolve, reject) => {
    cropCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        const file = new File([blob], fileName, { type: 'image/jpeg' })
        resolve(file)
      },
      'image/jpeg',
      0.95
    )
  })
}
