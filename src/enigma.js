import schema from 'enigma.js/schemas/12.170.2.json';

const getDocMixin = {
  types: ['Global'],
  init(args) {
    const { api } = args;
    const appID = /[^/]*$/.exec(api.session.rpc.url)[0];
    api.appID = appID;
  },
  extend: {
    async getDoc() {
      try {
        const activeDoc = await this.getActiveDoc();
        return activeDoc;
      } catch (e) {
        const doc = await this.openDoc(this.appID);
        return doc;
      }
    },
  },
};

const getOrCreateMixin = {
  types: ['Doc'],
  init(args) {
    const { api } = args;
    api.objectCache = {};
  },
  extend: {
    getOrCreateObject(def) {
      const key = JSON.stringify(def);
      this.objectCache[key] = this.objectCache[key] || this.createSessionObject(def);
      return this.objectCache[key];
    },
  },
};

const joinLayoutMixin = {
  types: ['filterbox'],
  override: {
    getLayout(base) {
      const wrap = (result) => {
        this.pendingLayout = null;
        if (result.error) throw result;
        return result;
      };
      const promise = this.pendingLayout || base().then(wrap, wrap);
      this.pendingLayout = promise;
      return promise;
    },
  },
};

export default {
  schema,
  url: new URLSearchParams(document.location.search).get('engine_url') || 'ws://localhost:9076/app/car.qvf',
  createSocket: url => new WebSocket(url),
  mixins: [getDocMixin, getOrCreateMixin, joinLayoutMixin],
  responseInterceptors: [{
    onRejected(session, request, error) {
      if (error.code === 15) return request.retry();
      throw error;
    },
  }],
};
