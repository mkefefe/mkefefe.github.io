/* Daily Math's optional Playgama Bridge boundary.
 * SDK/API: https://wiki.playgama.com/playgama/bridge-sdk/api
 * Ads: https://wiki.playgama.com/playgama/bridge-sdk/api/advertisement/interstitial
 * Pause/audio: https://wiki.playgama.com/playgama/bridge-sdk/api/platform
 * Never enabled implicitly: the ordinary local/offline build makes no ad calls.
 */
(function (root) {
  'use strict';
  const config = root.DAILY_PLATFORM_CONFIG || {};
  const enabled = config.enabled === true;
  const LOAD_TIMEOUT_MS = 10000, AD_LOADING_TIMEOUT_MS = 12000;
  let sdk = null, initialized = false, initPromise = null, readyWanted = false, readySent = false;
  let hostPaused = false, hostAudio = true, adState = 'idle';
  let pending = null, loadingTimer = null;
  let adsDisabled = false, status = enabled ? 'idle' : 'disabled';
  let gameplayWanted = false, gameplayReported = false;
  const listeners = new Set();
  const paused = () => !!document.hidden || hostPaused || adState === 'loading' || adState === 'opened';
  const audioAllowed = () => hostAudio && !paused();
  const snapshot = () => Object.freeze({ initialized, status, paused: paused(), audioAllowed: audioAllowed(), adState });
  function syncGameplay() {
    if (!initialized || !readySent) return;
    const active = gameplayWanted && !paused();
    if (active === gameplayReported) return;
    gameplayReported = active;
    // These are official Bridge platform messages, not custom analytics events.
    // Record the transition before dispatch: a host may synchronously emit pause.
    const message = active ? sdk.PLATFORM_MESSAGE.GAMEPLAY_STARTED : sdk.PLATFORM_MESSAGE.GAMEPLAY_STOPPED;
    try { Promise.resolve(sdk.platform.sendMessage(message)).catch(() => {}); } catch (_) {}
  }
  function notify() { syncGameplay(); for (const fn of listeners) { try { fn(snapshot()); } catch (_) {} } }
  function setGameplayActive(active) {
    const wanted = active === true;
    if (wanted === gameplayWanted) return;
    gameplayWanted = wanted; syncGameplay();
  }
  function onChange(fn) { if (typeof fn !== 'function') return () => {}; listeners.add(fn); try { fn(snapshot()); } catch (_) {} return () => listeners.delete(fn); }
  function clearLoadingTimer() { if (loadingTimer !== null) clearTimeout(loadingTimer); loadingTimer = null; }
  function armLoadingWatchdog() {
    if (loadingTimer !== null) return;
    loadingTimer = setTimeout(() => {
      // A late LOADING event can arrive after a prior request already timed out.
      // Give that loading phase its own bounded wait, but never time out OPENED.
      loadingTimer = null;
      if (adState !== 'opened') { adsDisabled = true; status = 'ad-unavailable'; finishAd('timeout'); }
    }, AD_LOADING_TIMEOUT_MS);
  }
  function finishAd(reason) {
    clearLoadingTimer(); adState = 'idle';
    const request = pending; pending = null;
    notify(); if (request) request.resolve(reason);
  }
  function onAdState(value) {
    // State names are official Bridge INTERSTITIAL_STATE values.
    if (value === 'loading') {
      // An out-of-order loading notification is not proof a visible ad closed.
      if (adState === 'opened') return;
      adState = 'loading'; armLoadingWatchdog(); notify();
    }
    else if (value === 'opened') {
      // Never resume gameplay on a timer while an ad is visibly open.
      clearLoadingTimer(); adState = 'opened'; notify();
    } else if (value === 'closed' || value === 'failed') finishAd(value);
  }
  function sendReady() {
    if (!initialized || !readyWanted || readySent) return;
    readySent = true;
    try { Promise.resolve(sdk.platform.sendMessage(sdk.PLATFORM_MESSAGE.GAME_READY)).catch(() => {}); } catch (_) {}
    syncGameplay();
  }
  function initialize() {
    if (initPromise) return initPromise;
    if (!enabled) return (initPromise = Promise.resolve(false));
    status = 'initializing'; notify();
    initPromise = (async () => {
      let timer;
      try {
        sdk = root.bridge;
        if (!sdk) throw new Error('Bridge must be the first blocking head script');
        // Ship the matching JSON config with autoShow:[]; options are also a safe
        // fallback if the host cannot load that file. Do not enable ad autoplay.
        await Promise.race([
          sdk.initialize({ configFilePath: './playgama-bridge-config.json', advertisement: {
            interstitial: { autoShow: [] }
          } }),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Bridge initialization timed out')), LOAD_TIMEOUT_MS); })
        ]);
        clearTimeout(timer);
        sdk.advertisement.on(sdk.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, onAdState);
        sdk.platform.on(sdk.EVENT_NAME.PAUSE_STATE_CHANGED, value => { hostPaused = !!value; notify(); });
        sdk.platform.on(sdk.EVENT_NAME.AUDIO_STATE_CHANGED, value => { hostAudio = value !== false; notify(); });
        hostPaused = sdk.platform.isPaused === true;
        hostAudio = sdk.platform.isAudioEnabled !== false;
        // Preserve platform frequency defaults; request only on Continue.
        if (sdk.advertisement.interstitialState === 'opened' || sdk.advertisement.interstitialState === 'loading') onAdState(sdk.advertisement.interstitialState);
        adsDisabled = sdk.platform.id === 'mock';
        initialized = true; status = adsDisabled ? 'preview' : 'ready'; sendReady(); notify(); return true;
      } catch (_) { clearTimeout(timer); status = 'unavailable'; adsDisabled = true; notify(); return false; }
    })();
    return initPromise;
  }
  function ready() { readyWanted = true; return initialize().then(ok => { sendReady(); return ok; }); }
  function roundFinished() { /* Compatibility hook: SDK alone controls ad frequency. */ }
  function beforeNextQuestion() {
    if (pending) return pending.promise;
    if (!initialized || !readySent || adsDisabled || !sdk.advertisement.isInterstitialSupported || paused()) return Promise.resolve('not-due');
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    pending = { promise, resolve }; const request = pending; adState = 'loading'; notify();
    // No-fill normally reports FAILED. If a host never replies, continue offline
    // and disable further attempts, while still honoring later SDK/host events.
    armLoadingWatchdog();
    try {
      const result = sdk.advertisement.showInterstitial('between_questions');
      // Bridge is event based. A fulfilled return value is not proof the ad closed.
      if (result && typeof result.catch === 'function') result.catch(() => { if (pending === request && adState !== 'opened') finishAd('failed'); });
    } catch (_) { if (pending === request && adState !== 'opened') finishAd('failed'); }
    return promise;
  }
  document.addEventListener('visibilitychange', notify);
  root.DailyPlatform = Object.freeze({ initialize, ready, roundFinished, beforeNextQuestion, setGameplayActive, isPaused: paused, audioAllowed, onChange, language: () => initialized ? (sdk.platform.language || 'en') : 'en' });
})(window);
