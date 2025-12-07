const LOADED_SCRIPTS: Record<string, Promise<void>> = {};

export const loadScript = (src: string): Promise<void> => {
  if (LOADED_SCRIPTS[src]) return LOADED_SCRIPTS[src];

  LOADED_SCRIPTS[src] = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });

  return LOADED_SCRIPTS[src];
};
