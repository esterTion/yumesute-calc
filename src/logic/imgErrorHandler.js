function handler() {
	if (this.src === 'about:blank') return
	if (this.src.includes('?t=')) return
	this.src += '?t=' + Date.now()
}

export default function imgErrorHandler(img) {
	img.addEventListener('error', handler)
	return img
}
