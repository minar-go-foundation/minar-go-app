export async function blobToBase64(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

export async function saveBlobToDevice(blob: Blob, filename: string): Promise<boolean> {
  // Try Capacitor Filesystem when available (Android/iOS native build)
  try {
    const cap = (window as any).Capacitor;
    const isAndroid = cap?.getPlatform?.() === 'android' || cap?.isNativePlatform;
    if (cap && isAndroid) {
      try {
        const base64 = await blobToBase64(blob);
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const path = `Download/${filename}`;
        await Filesystem.writeFile({ path, data: base64, directory: Directory.External });
        return true;
      } catch (e) {
        console.warn('Capacitor filesystem write failed:', e);
      }
    }
  } catch (e) {
    console.warn('Capacitor not available or import failed', e);
  }

  // Web fallback: create object URL and trigger download
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 500);
    return true;
  } catch (e) {
    console.error('Download fallback failed', e);
    return false;
  }
}
