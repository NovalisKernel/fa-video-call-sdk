const hasStorage = (function check() {
  try {
    return !!sessionStorage.getItem;
  } catch (exception) {
    return false;
  }
})();

function getCall() {
  if (hasStorage) {
    return JSON.parse(sessionStorage.getItem('shared_call'));
  }
  return null;
}

function setCall(call) {
  if (hasStorage) {
    const existed = JSON.parse(sessionStorage.getItem('shared_call'));
    if (existed) sessionStorage.removeItem('shared_call');
    sessionStorage.setItem('shared_call', JSON.stringify(call));
  }
}

function removeCall() {
  if (hasStorage) sessionStorage.removeItem('shared_call');
}

function setGuestToken(guestSocketId) {
  if (hasStorage) {
    const existed = JSON.parse(sessionStorage.getItem('guest_token'));
    if (existed) sessionStorage.removeItem('guest_token');
    sessionStorage.setItem('guest_token', JSON.stringify({ guestSocketId }));
  }
}

function removeGuestToken() {
  if (hasStorage) sessionStorage.removeItem('guest_token');
}

function getGuestToken() {
  if (hasStorage) {
    return JSON.parse(sessionStorage.getItem('guest_token'));
  }
  return null;
}

export { setCall, getCall, removeCall, setGuestToken, removeGuestToken, getGuestToken };
