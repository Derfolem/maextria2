import toast from 'react-hot-toast';

export const isMobileUserAgent = () =>
  typeof navigator !== 'undefined' &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const dataUriToBlob = (dataUri: string) => {
  const [meta, base64Data] = dataUri.split(',');
  const mimeMatch = meta?.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] || 'application/pdf';
  const binary = atob(base64Data || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

export const openPdfPopup = () => {
  if (typeof window === 'undefined') return null;
  const popup = window.open('', '_blank');
  if (popup && popup.document) {
    popup.document.title = 'Carregando certificado...';
    popup.document.body.style.margin = '0';
    popup.document.body.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
    popup.document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#f8fafc;">
        <div style="text-align:center;max-width:320px;padding:24px;">
          <div style="font-size:14px;letter-spacing:0.3em;text-transform:uppercase;opacity:0.7;margin-bottom:12px;">
            MAEXTRIA
          </div>
          <div style="font-size:18px;font-weight:600;margin-bottom:8px;">Aguarde, estamos gerando seu PDF</div>
          <div style="font-size:13px;opacity:0.7;">Isso pode levar alguns segundos no celular.</div>
        </div>
      </div>
    `;
  }
  return popup;
};

export const setPdfPopupError = (popup: Window | null, message: string) => {
  if (!popup || popup.closed || !popup.document) return;
  popup.document.title = 'Falha ao abrir PDF';
  popup.document.body.style.margin = '0';
  popup.document.body.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
  popup.document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#f8fafc;">
      <div style="text-align:center;max-width:340px;padding:24px;">
        <div style="font-size:18px;font-weight:600;margin-bottom:8px;">Nao foi possivel abrir o PDF</div>
        <div style="font-size:13px;opacity:0.7;">${message}</div>
      </div>
    </div>
  `;
};

export const handlePdfDownload = (dataUri: string, filename: string, targetWindow?: Window | null) => {
  try {
    const blobUrl = URL.createObjectURL(dataUriToBlob(dataUri));

    if (targetWindow && !targetWindow.closed) {
      targetWindow.location.href = blobUrl;
    } else if (isMobileUserAgent()) {
      const opened = window.open(blobUrl, '_blank');
      if (!opened) {
        toast.error('Permita pop-ups para abrir o PDF no dispositivo.');
      }
    } else {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
  } catch {
    setPdfPopupError(targetWindow || null, 'Tente novamente ou permita pop-ups no navegador.');
    toast.error('Nao foi possivel preparar o PDF para download.');
  }
};
