
import { applyPolyfills, defineCustomElements as dce } from '../loader';
export { defineCustomElements, addTheme };

function defineCustomElements(components=[]) {
  return applyPolyfills().then(() => dce(window));
}

function addTheme(_theme) {
  const { store, actions, storeReady } = window.CorporateUi || {};

  if (storeReady) {
    return init(_theme, { detail: { store, actions } });
  }

  // TODO: Maybe this event listener should be accesable from the theme itself?
  document.addEventListener('storeReady', event => init(_theme, event));

  function init(theme, event) {
    const name = Object.keys(theme)[0];
    theme[name].components = document.head.attachShadow ? theme[name].components.default : theme[name].components.ie;

    [
      { type: 'ADD_THEME', theme },
    ].map(item => {
      item.type = event.detail.actions[item.type];
      event.detail.store.dispatch(item);
    });
  }
}