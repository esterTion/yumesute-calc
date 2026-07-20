export default class WebpLoader {
  static instance;
  worker;
  id;

  init() {
    this.id = 0;
    this.worker = new Worker('./webp-idec.js', { type: 'module' });
    this.pendingMessage = {};
    this.worker.onmessage = e => this.onMessage(e);
    this.worker.onerror = e => console.error('Worker error', e);
  }
  load(url, onImage, onError) {
    const abort = new AbortController();
    const msg = {};
    const deleteObject = () => {
      if (!msg.objId) return
      delete msg.buf;
      msg.deleteObject = true;
      this.worker.postMessage(msg);
    }
    fetch(url, { mode: 'cors', signal: abort.signal }).then(async res => {
      const code = res.status;
      if (code !== 200) {
        onError?.({
          error: 'HTTP error ' + code,
          res,
        });
        return;
      }
      const size = Number(res.headers.get('Content-Length'));
      if (isNaN(size)) {
        onError?.({
          error: 'Content-Length header is missing',
          res,
        });
        return;
      }
      const canvas = document.createElement('canvas');
      const reader = res.body.getReader();
      msg.size = size;
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          deleteObject()
          onImage(canvas, true);
          break;
        }
        const buf = value.buffer;
        msg.buf = buf;
        const [image, id] = await this.appendChunk(msg, [buf]);
        msg.objId = id;
        if (image) {
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d');
          ctx.putImageData(image, 0, 0);
        }
        onImage(canvas, false);
        delete msg.canvas;
      }
    }).catch(e => {
      console.error(e);
      deleteObject();
      onError?.({
        error: 'Failed to fetch',
        details: e,
      })
    });
    return abort;
  }

  appendChunk(msg, transfer) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      new Promise(resolve => {
        this.pendingMessage[id] = resolve;
      }).then(result => {
        delete this.pendingMessage[id];
        if (result.error) {
          reject(result.error);
          return;
        }
        resolve([
          result.image,
          result.objId,
        ]);
      });
      msg.id = id;
      this.worker.postMessage(msg, transfer);
    });
  }
  onMessage(e) {
    const { id } = e.data;
    this.pendingMessage[id]?.(e.data);
  }
};

WebpLoader.instance = new WebpLoader;
