export function isAbsolute(path) {
  return path.startsWith('/') || path.startsWith('\\') || /^[a-z]:[/\\]/i.test(path);
}
