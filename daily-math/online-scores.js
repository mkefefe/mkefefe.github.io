/* Optional server-authoritative scores. No endpoint config means no requests.
 * Set window.DAILY_SCORE_CONFIG = {endpoint:'https://reviewed-worker.example'}
 * before loading this file. Never configure an unreviewed third-party endpoint.
 *
 * DailyScores: enabled, persistent, initialize(), startRound(questionId),
 * act('hint'|'answer'|'skip', choice?), loadLeaderboard(), rename(name),
 * getProfile(), getActiveRound(). Returned objects never contain credentials.
 * Failed mutations retain their request UUID until their payload changes or
 * succeeds; duplicate in-flight calls share a promise. All writes serialize.
 */
(function (root) {
  'use strict';
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const TOKEN = /^[0-9a-f]{64}$/;
  const TIMEOUT = 8000;
  class ScoreError extends Error {
    constructor(code, message, options = {}) {
      super(message);
      this.name = 'DailyScoreError';
      this.code = code;
      this.status = options.status || 0;
      this.retryable = !!options.retryable;
      if (options.activeRound) this.activeRound = copy(options.activeRound);
      if (options.player) this.player = copy(options.player);
    }
  }
  const copy = value => value == null ? null : JSON.parse(JSON.stringify(value));
  let endpoint = null, configError = null;
  const configured = root.DAILY_SCORE_CONFIG && Object.hasOwn(root.DAILY_SCORE_CONFIG, 'endpoint');
  if (configured) {
    try {
      const raw = root.DAILY_SCORE_CONFIG.endpoint;
      if (typeof raw !== 'string' || raw.length > 2048 || !/^https?:\/\//.test(raw) || /[\\\s]/.test(raw)) throw Error();
      const url = new URL(raw);
      const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) || url.username || url.password || url.search || url.hash || !/^\/*$/.test(url.pathname)) throw Error();
      endpoint = url.origin;
    } catch {
      configError = new ScoreError('invalid_endpoint', 'Online scores are not configured correctly. You can still play offline.');
    }
  }
  const storageKey = endpoint ? 'daily-math-online-v1:' + encodeURIComponent(endpoint) : null;
  let credentials = null, credentialError = null, storageRead = false, persistent = true;
  let player = null, activeRound = null, initialized = false, initialization = null;
  let writeQueue = Promise.resolve();
  const inFlight = new Map(), pendingRequests = new Map();

  function requireEnabled() {
    if (configError) throw configError;
    if (!endpoint) throw new ScoreError('offline', 'Online scores are not enabled. Your offline game is still available.');
  }
  function publicPlayer(value) {
    if (!value || !UUID.test(value.id) || typeof value.name !== 'string' || !Number.isSafeInteger(value.score) || value.score < 0) {
      throw new ScoreError('invalid_response', 'The score server returned an incomplete profile.', {retryable: true});
    }
    return {id: value.id, name: value.name, score: value.score};
  }
  function publicRound(value) {
    if (value == null) return null;
    if (!UUID.test(value.id) || typeof value.questionId !== 'string' || !/^[0-5]:\d+$/.test(value.questionId) ||
        !Number.isInteger(value.hints) || value.hints < 0 || value.hints > 3 ||
        !Number.isInteger(value.mistakes) || value.mistakes < 0 || value.mistakes > 2 ||
        typeof value.completed !== 'boolean' || !Array.isArray(value.excluded) || !value.excluded.every(x => typeof x === 'string')) {
      throw new ScoreError('invalid_response', 'The score server returned an incomplete round.', {retryable: true});
    }
    return {id:value.id, questionId:value.questionId, hints:value.hints, mistakes:value.mistakes, completed:value.completed, excluded:[...value.excluded]};
  }
  function ownPlayer(value) {
    const fresh = publicPlayer(value);
    if (!credentials || fresh.id !== credentials.id) throw new ScoreError('invalid_response', 'The score server returned a different profile.');
    return fresh;
  }
  function readCredentials() {
    if (storageRead) { if (credentialError) throw credentialError; return; }
    storageRead = true;
    let raw;
    try { raw = root.DailyStorage.getItem(storageKey); }
    catch { persistent = false; return; }
    if (!raw) return;
    try {
      const stored = JSON.parse(raw);
      if (!UUID.test(stored.id) || !TOKEN.test(stored.token)) throw Error();
      credentials = {id: stored.id, token: stored.token};
    } catch {
      credentialError = new ScoreError('invalid_credentials', 'The saved online profile could not be read. It has not been replaced.');
      throw credentialError;
    }
  }
  function saveCredentials() {
    try { root.DailyStorage.setItem(storageKey, JSON.stringify(credentials)); }
    catch { persistent = false; }
  }
  function requestId(path, payload) {
    const key = JSON.stringify(payload), pending = pendingRequests.get(path);
    if (pending && pending.key === key) return pending.id;
    let id;
    if (root.crypto && typeof root.crypto.randomUUID === 'function') id = root.crypto.randomUUID();
    else if (root.crypto && typeof root.crypto.getRandomValues === 'function') {
      const bytes = root.crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
      const hex = [...bytes].map(x => x.toString(16).padStart(2, '0')).join('');
      id = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    } else throw new ScoreError('secure_random_unavailable', 'This browser cannot create a secure online request. Use offline play.');
    pendingRequests.set(path, {id, key});
    return id;
  }
  function mapServerError(status, data) {
    const messages = {
      active_round: 'Finish or resume your current online question first.',
      rate_limited: 'Please wait a minute before trying again.',
      unauthorized: 'Your online profile could not be verified. It has not been replaced.',
      invalid_name: 'Choose a name between 1 and 20 characters.',
      invalid_action: 'That action could not be applied to this question.',
      invalid_round: 'This question is not available in the online catalogue.',
      round_completed: 'This online question has already been completed.',
      request_id_reused: 'The server could not safely repeat this request. Reload to resume your online progress.'
    };
    const code = status === 401 ? 'invalid_credentials' : typeof data?.error === 'string' ? data.error : 'server_error';
    let round = null, freshPlayer = null;
    if (code === 'active_round') {
      round = publicRound(data.activeRound); freshPlayer = ownPlayer(data.player);
      activeRound = round && !round.completed ? round : null; player = freshPlayer;
    }
    return new ScoreError(code, status === 401 ? messages.unauthorized : messages[code] ||
      (status >= 500 ? 'Online scores are temporarily unavailable. Please try again.' : 'The score server could not accept that request.'),
      {status, retryable:status >= 500, activeRound:round, player:freshPlayer});
  }
  async function requestOnce(path, method, body, authenticated) {
    const controller = new root.AbortController();
    let timer;
    const headers = {'Accept':'application/json'};
    if (method === 'POST') headers['Content-Type'] = 'application/json';
    if (authenticated) {
      if (!credentials) throw new ScoreError('invalid_credentials', 'An online profile is required.');
      headers.Authorization = 'Bearer ' + credentials.token;
      headers['X-Player-Id'] = credentials.id;
    }
    const timeout = new Promise((resolve, reject) => {
      timer = root.setTimeout(() => {
        controller.abort();
        reject(new ScoreError('timeout', 'The score server took too long to respond. Please try again.', {retryable:true}));
      }, TIMEOUT);
    });
    const operation = (async () => {
      let response;
      try {
        response = await root.fetch(endpoint + path, {method, headers, body:method === 'POST' ? JSON.stringify(body || {}) : undefined,
          signal:controller.signal, cache:'no-store', credentials:'omit', redirect:'error'});
      } catch {
        throw new ScoreError('network_error', 'Could not reach online scores. Please try again.', {retryable:true});
      }
      let data;
      try { data = await response.json(); }
      catch {
        if (!response.ok) throw mapServerError(response.status, null);
        throw new ScoreError('invalid_response', 'The score server response was incomplete. Please try again.', {retryable:true});
      }
      if (!response.ok) throw mapServerError(response.status, data);
      return data;
    })();
    try { return await Promise.race([operation, timeout]); }
    finally { root.clearTimeout(timer); }
  }
  async function request(path, method, body, authenticated = true) {
    requireEnabled();
    for (let attempt=0; attempt<2; attempt++) {
      try { return await requestOnce(path, method, body, authenticated); }
      catch (error) {
        if (!(error instanceof ScoreError)) throw new ScoreError('network_error', 'Online scores are unavailable. Please try again.');
        if (!error.retryable || attempt === 1) throw error;
      }
    }
  }
  const snapshot = () => ({enabled:!!endpoint, player:copy(player), activeRound:copy(activeRound)});
  function initialize() {
    if (configError) return Promise.reject(configError);
    if (!endpoint) return Promise.resolve(snapshot());
    if (initialized) return Promise.resolve(snapshot());
    if (initialization) return initialization;
    initialization = (async () => {
      readCredentials();
      const existed = !!credentials;
      const data = await request('/api/player', 'POST', {}, existed);
      const freshPlayer = publicPlayer(data), freshRound = publicRound(data.activeRound);
      if (existed && freshPlayer.id !== credentials.id) throw new ScoreError('invalid_response', 'The score server returned a different profile.');
      if (!existed) {
        if (!TOKEN.test(data.token)) throw new ScoreError('invalid_response', 'The score server did not return a valid profile credential.');
        credentials = {id:freshPlayer.id, token:data.token}; saveCredentials();
      }
      player=freshPlayer; activeRound=freshRound && !freshRound.completed ? freshRound : null; initialized=true;
      return snapshot();
    })();
    initialization.then(() => { initialization=null; }, () => { initialization=null; });
    return initialization;
  }
  function serialized(key, action) {
    if (inFlight.has(key)) return inFlight.get(key);
    const promise = writeQueue.catch(() => {}).then(action);
    writeQueue = promise;
    inFlight.set(key, promise);
    promise.then(() => { if (inFlight.get(key) === promise) inFlight.delete(key); },
      () => { if (inFlight.get(key) === promise) inFlight.delete(key); });
    return promise;
  }
  function startRound(questionId) {
    return serialized('round:' + questionId, async () => {
      requireEnabled(); await initialize();
      if (typeof questionId !== 'string' || !/^[0-5]:\d+$/.test(questionId)) throw new ScoreError('invalid_round', 'Choose a valid online question.');
      if (activeRound) {
        if (activeRound.questionId === questionId) return {round:copy(activeRound), player:copy(player)};
        throw new ScoreError('active_round', 'Finish or resume your current online question first.', {status:409, activeRound, player});
      }
      const payload = {questionId}, id = requestId('/api/round', payload);
      const data = await request('/api/round', 'POST', {...payload, requestId:id});
      const freshRound = publicRound(data.round), freshPlayer = ownPlayer(data.player);
      if (!freshRound || freshRound.questionId !== questionId) throw new ScoreError('invalid_response', 'The server returned a different question.');
      activeRound=freshRound.completed ? null : freshRound; player=freshPlayer;
      pendingRequests.delete('/api/round');
      return {round:copy(freshRound), player:copy(player)};
    });
  }
  function act(type, choice) {
    const key='action:'+JSON.stringify([type,choice]);
    return serialized(key, async () => {
      requireEnabled(); await initialize();
      if (!['hint','answer','skip'].includes(type) || (type === 'answer' && (typeof choice !== 'string' || !choice.length || choice.length>200))) {
        throw new ScoreError('invalid_action', 'Choose a valid answer or action.');
      }
      if (!activeRound) throw new ScoreError('no_active_round', 'Start an online question before answering.');
      const round = activeRound;
      const payload={roundId:round.id,type};
      if (type === 'answer') payload.choice=choice;
      const id=requestId('/api/action',payload);
      const data=await request('/api/action','POST',{...payload,requestId:id});
      const freshPlayer=ownPlayer(data.player);
      const freshRound=publicRound({id:data.roundId,questionId:round.questionId,hints:data.hints,mistakes:data.mistakes,completed:data.completed,excluded:data.excluded});
      if (data.roundId !== round.id || data.requestId !== id || typeof data.result !== 'string' || !Number.isSafeInteger(data.delta) || !Number.isSafeInteger(data.score)) {
        throw new ScoreError('invalid_response','The score server returned a mismatched action.');
      }
      player=freshPlayer; activeRound=freshRound.completed ? null : freshRound;
      pendingRequests.delete('/api/action');
      return {result:data.result,delta:data.delta,score:data.score,hints:data.hints,mistakes:data.mistakes,completed:data.completed,
        excluded:[...data.excluded],roundId:data.roundId,requestId:data.requestId,player:copy(player)};
    });
  }
  async function loadLeaderboard() {
    requireEnabled(); await initialize();
    const data=await request('/api/leaderboard?player='+encodeURIComponent(player.id),'GET',null,false);
    if (!data || !Array.isArray(data.entries) || !Number.isInteger(data.total) || data.total<0) throw new ScoreError('invalid_response','The leaderboard could not be read.');
    const entry=value=>{
      const p=publicPlayer(value);
      if (!Number.isInteger(value.rank) || value.rank<1) throw new ScoreError('invalid_response','The leaderboard could not be read.');
      return {...p,rank:value.rank};
    };
    return {entries:data.entries.map(entry),total:data.total,you:data.you ? entry(data.you) : null};
  }
  function rename(name) {
    return serialized('name:'+name, async () => {
      requireEnabled(); await initialize();
      if (typeof name !== 'string' || !name.trim() || name.trim().length>20) throw new ScoreError('invalid_name','Choose a name between 1 and 20 characters.');
      const data=await request('/api/name','POST',{name:name.trim()});
      player=ownPlayer(data); return copy(player);
    });
  }
  Object.defineProperty(root,'DailyScores',{value:Object.freeze({
    get enabled(){return !!endpoint;}, get persistent(){return persistent;},
    initialize,startRound,act,loadLeaderboard,rename,
    getProfile:()=>copy(player),getActiveRound:()=>copy(activeRound)
  }),configurable:true});
})(typeof window !== 'undefined' ? window : globalThis);
