// Rastreia o estado da conversa de cada usuário
const userState = new Map();

function initState(userId) {
  if (!userState.has(userId)) {
    userState.set(userId, {
      step: null,
      data: {},
    });
  }
  return userState.get(userId);
}

function getState(userId) {
  return userState.get(userId) || initState(userId);
}

function setState(userId, step, data = {}) {
  const state = initState(userId);
  state.step = step;
  state.data = { ...state.data, ...data };
}

function clearState(userId) {
  userState.delete(userId);
}

module.exports = { getState, setState, clearState };
