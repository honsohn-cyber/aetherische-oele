// 80er-Songs: Karten, Favoriten, Filter, Geschmack. Lädt den Song ins Studio.
'use strict';

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

const SongsUI = {
  favs: [],
  taste: [],
  filter: 'alle',

  init() {
    this.favs = store.get('songFavs', []);
    this.taste = store.get('taste', DEFAULT_TASTE);
    $('#tasteInput').value = this.taste.join(', ');
    $('#tasteSave').addEventListener('click', () => {
      const list = $('#tasteInput').value.split(',').map((x) => x.trim()).filter(Boolean);
      this.taste = list.length ? list : DEFAULT_TASTE;
      store.set('taste', this.taste);
      this.renderTaste();
      this.render();
    });
    this.renderTaste();
    this.renderFilter();
    this.render();
  },

  renderTaste() {
    const wrap = $('#tasteBands');
    wrap.innerHTML = '';
    this.taste.forEach((name) => {
      const a = document.createElement('a');
      a.className = 'band-chip';
      a.href = artistUrl(name);
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = name;
      wrap.appendChild(a);
    });
  },

  score(song) {
    const t = new Set(this.taste.map(norm));
    return song.artists.filter((a) => t.has(norm(a))).length;
  },

  renderFilter() {
    const wrap = $('#songFilter');
    wrap.innerHTML = '';
    const tags = ['alle', '★ Favoriten', ...new Set(SONGS.map((s) => s.tag))];
    tags.forEach((name) => {
      const b = document.createElement('button');
      b.className = 'fchip' + (this.filter === name ? ' on' : '');
      b.textContent = name === 'alle' ? 'Alle' : name;
      b.addEventListener('click', () => { this.filter = name; this.renderFilter(); this.render(); });
      wrap.appendChild(b);
    });
  },

  duration(song) {
    const bars = songBars(song).bars.length;
    const sec = (bars * 4 * 60) / song.bpm;
    return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')} min`;
  },

  toggleFav(id) {
    this.favs = this.favs.includes(id) ? this.favs.filter((x) => x !== id) : [...this.favs, id];
    store.set('songFavs', this.favs);
    this.render();
  },

  render() {
    const grid = $('#songGrid');
    grid.innerHTML = '';
    let list = SONGS.filter((s) => this.filter === 'alle' || (this.filter === '★ Favoriten' ? this.favs.includes(s.id) : s.tag === this.filter));
    list = list.slice().sort((a, b) => (this.favs.includes(b.id) - this.favs.includes(a.id)) || (this.score(b) - this.score(a)));
    if (!list.length) {
      grid.innerHTML = '<p class="hint">Noch keine Favoriten – klicke auf den Stern einer Karte.</p>';
      return;
    }
    list.forEach((s) => {
      const fav = this.favs.includes(s.id);
      const sc = this.score(s);
      const card = document.createElement('article');
      card.className = 'song-card';
      card.style.setProperty('--hue', s.hue);
      const icons = [...new Set(s.band.map((b) => INST[b.kind].icon))].join(' ');
      card.innerHTML = `
        <div class="cover">
          <span class="cover-style"></span>
          <span class="cover-title"></span>
          <button class="fav" title="Favorit"></button>
        </div>
        <div class="song-body">
          <p class="ref"></p>
          <div class="song-meta"><span class="k"></span><span class="b"></span><span class="d"></span></div>
          <div class="song-band" title="Band"></div>
          <p class="tip"></p>
          <div class="listen"><span>Reinhören:</span></div>
          <div class="song-actions"><button class="primary play">▶ Laden &amp; spielen</button></div>
        </div>`;
      card.querySelector('.cover-style').textContent = s.style;
      card.querySelector('.cover-title').textContent = s.title;
      const fb = card.querySelector('.fav');
      fb.textContent = fav ? '★' : '☆';
      fb.classList.toggle('on', fav);
      fb.addEventListener('click', () => this.toggleFav(s.id));
      card.querySelector('.ref').textContent = 'Inspiriert vom Sound von ' + s.artists.join(' & ') + (sc ? '  ·  ★ passt zu deinem Geschmack' : '');
      card.querySelector('.k').textContent = s.key;
      card.querySelector('.b').textContent = `${s.bpm} BPM`;
      card.querySelector('.d').textContent = this.duration(s);
      card.querySelector('.song-band').textContent = icons;
      card.querySelector('.tip').textContent = s.tip;
      const listen = card.querySelector('.listen');
      s.artists.forEach((name) => {
        const a = document.createElement('a');
        a.className = 'band-chip';
        a.href = artistUrl(name);
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = name;
        listen.appendChild(a);
      });
      card.querySelector('.play').addEventListener('click', async () => {
        if (!Studio.loadSong(s.id)) return;
        setTab('studio');
        await Studio.play();
      });
      grid.appendChild(card);
    });
  },
};
