/** "Chrome 131 · Windows" from a user-agent string — rough, for grouping errors by browser. */
export const browserLabel = (ua: string): string => {
  if (!ua) return '';
  const pick = (re: RegExp, name: string) => {
    const m = re.exec(ua);
    return m ? `${name} ${m[1]}` : null;
  };
  const name =
    pick(/Edg(?:A|iOS)?\/(\d+)/, 'Edge') ??
    pick(/(?:OPR|Opera)\/(\d+)/, 'Opera') ??
    pick(/coc_coc_browser\/(\d+)/, 'Cốc Cốc') ??
    pick(/SamsungBrowser\/(\d+)/, 'Samsung Internet') ??
    pick(/Zalo\D*(\d+)/, 'Zalo') ??
    pick(/CriOS\/(\d+)/, 'Chrome') ??
    pick(/FxiOS\/(\d+)/, 'Firefox') ??
    pick(/Chrome\/(\d+)/, 'Chrome') ??
    pick(/Firefox\/(\d+)/, 'Firefox') ??
    pick(/Version\/(\d+(?:\.\d+)?).*Safari/, 'Safari') ??
    'Trình duyệt khác';
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad|iPod/.test(ua)
      ? 'iOS'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : '';
  return [name, os].filter(Boolean).join(' · ');
};
