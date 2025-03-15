function handler() {
  if (this.src === 'about:blank') return
  if (this.src.includes('?t=')) return
  this.src += '?t=' + Date.now()
}

function removePreviewLoading() {
  this.classList.remove('preview-loading')
}

export default function imgErrorHandler(img) {
  img.addEventListener('error', handler)
  img.addEventListener('load', removePreviewLoading)
  return img
}
