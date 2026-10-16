(function () {
  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: options.body instanceof FormData
        ? options.headers
        : { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Permintaan gagal');
    return payload;
  }

  class Query {
    constructor(table) {
      this.table = table;
      this.action = 'select';
      this.payload = null;
      this.filters = {};
      this.sort = null;
      this.wantSingle = false;
    }
    select() { return this; }
    insert(value) { this.action = 'insert'; this.payload = value; return this; }
    update(value) { this.action = 'update'; this.payload = value; return this; }
    delete() { this.action = 'delete'; return this; }
    eq(column, value) { this.filters[column] = value; return this; }
    order(column, options = {}) { this.sort = { column, ascending: options.ascending !== false }; return this; }
    single() { this.wantSingle = true; return this; }
    async execute() {
      try {
        let url = `/api/data/${encodeURIComponent(this.table)}`;
        let options = {};
        if (this.action === 'select') {
          const params = new URLSearchParams();
          if (this.sort) {
            params.set('order', this.sort.column);
            params.set('direction', this.sort.ascending ? 'asc' : 'desc');
          }
          if (this.filters.id) params.set('id', this.filters.id);
          if ([...params].length) url += `?${params}`;
        } else if (this.action === 'insert') {
          options = { method: 'POST', body: JSON.stringify(this.payload) };
        } else {
          if (!this.filters.id) throw new Error('ID wajib untuk perubahan data');
          url += `/${encodeURIComponent(this.filters.id)}`;
          options = this.action === 'update'
            ? { method: 'PATCH', body: JSON.stringify(this.payload) }
            : { method: 'DELETE' };
        }
        const result = await request(url, options);
        let data = result.data;
        if (this.wantSingle && Array.isArray(data)) data = data[0] || null;
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
    then(resolve, reject) { return this.execute().then(resolve, reject); }
  }

  const uploadedUrls = new Map();
  const storageBucket = {
    async upload(path, file) {
      try {
        const form = new FormData();
        form.append('path', path);
        form.append('file', file);
        const result = await request('/api/storage/upload', { method: 'POST', body: form });
        uploadedUrls.set(path, result.data.publicUrl);
        return { data: result.data, error: null };
      } catch (error) { return { data: null, error }; }
    },
    getPublicUrl(path) {
      return { data: { publicUrl: uploadedUrls.get(path) || `${location.origin}/produk-images/${path}` } };
    },
    async remove(paths) {
      try {
        const result = await request('/api/storage/remove', {
          method: 'POST', body: JSON.stringify({ paths })
        });
        return { data: result.data, error: null };
      } catch (error) { return { data: null, error }; }
    }
  };

  window.appBackend = {
    auth: {
      async signInWithPassword(credentials) {
        try {
          const result = await request('/api/auth/login', {
            method: 'POST', body: JSON.stringify(credentials)
          });
          return { data: { user: result.user }, error: null };
        } catch (error) { return { data: null, error }; }
      },
      async signUp(credentials) {
        try {
          const result = await request('/api/auth/signup', {
            method: 'POST', body: JSON.stringify(credentials)
          });
          return { data: { user: result.user }, error: null };
        } catch (error) { return { data: null, error }; }
      },
      async signOut() {
        try { await request('/api/auth/logout', { method: 'POST', body: '{}' }); } catch (_) {}
        return { error: null };
      },
      async getSession() {
        try {
          const result = await request('/api/auth/session');
          return { data: { session: result.user ? { user: result.user } : null }, error: null };
        } catch (error) { return { data: { session: null }, error }; }
      }
    },
    from(table) { return new Query(table); },
    storage: { from() { return storageBucket; } }
  };
})();
