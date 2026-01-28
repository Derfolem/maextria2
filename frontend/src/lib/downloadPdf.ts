import toast from 'react-hot-toast';

const isMobileUserAgent = () =>
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

export const handlePdfDownload = (dataUri: string, filename: string) => {
  try {
    const blobUrl = URL.createObjectURL(dataUriToBlob(dataUri));

    if (isMobileUserAgent()) {
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

    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    toast.error('Nao foi possivel preparar o PDF para download.');
  }
};
