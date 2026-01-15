export function confirmUser(message: string): boolean {
  // eslint-disable-next-line no-alert
  return window.confirm(message);
}

export function alertUser(message: string): void {
  // eslint-disable-next-line no-alert
  window.alert(message);
}
