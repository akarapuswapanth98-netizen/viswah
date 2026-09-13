export function onKeyDown(e, onClick) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onClick?.(e);
  }
}
