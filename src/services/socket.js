import openSocket from 'socket.io-client';

let SOCKET = null;

function handleOpenSocket(apiUri) {
  SOCKET = openSocket(apiUri);
  return SOCKET;
}

function getSocket() {
  if (SOCKET) return SOCKET;
  return undefined;
}

function openSocketConnection() {
  if (SOCKET) return SOCKET.connect();
  return undefined;
}
function closeSocketConnection() {
  if (SOCKET) return SOCKET.disconnect();
  return undefined;
}

export default {
  handleOpenSocket,
  getSocket,
  closeSocketConnection,
  openSocketConnection,
};
