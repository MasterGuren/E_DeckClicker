// ========== Card Definitions ==========
const CARD_DEFS = {
  // --- スターター ---
  strike: {
    name: "ストライク",
    icon: "⚔️",
    desc: "クリックダメージ +1",
    rarity: "common",
    effect(game) { game.dmgBonus += 1; },
  },
  guard: {
    name: "ガード",
    icon: "🛡️",
    desc: "カードを1枚引く",
    rarity: "common",
    effect(game) { game.drawCards(1); },
  },

  // --- コモン ---
  heavyStrike: {
    name: "ヘビーストライク",
    icon: "🔨",
    desc: "クリックダメージ +3",
    rarity: "common",
    effect(game) { game.dmgBonus += 3; },
  },
  quickDraw: {
    name: "クイックドロー",
    icon: "📥",
    desc: "カードを2枚引く",
    rarity: "common",
    effect(game) { game.drawCards(2); },
  },
  bash: {
    name: "バッシュ",
    icon: "💥",
    desc: "即座に 8 ダメージ",
    rarity: "common",
    effect(game) { game.dealDirectDamage(8); },
  },
  sharpen: {
    name: "研ぎ澄ます",
    icon: "🔪",
    desc: "クリックダメージ +2",
    rarity: "common",
    effect(game) { game.dmgBonus += 2; },
  },

  // --- レア ---
  rage: {
    name: "レイジ",
    icon: "🔥",
    desc: "クリックダメージ x2",
    rarity: "rare",
    effect(game) { game.dmgMultiplier *= 2; },
  },
  comboStrike: {
    name: "コンボストライク",
    icon: "⚡",
    desc: "使ったカード数 x3 ダメージ",
    rarity: "rare",
    effect(game) { game.dealDirectDamage(game.cardsPlayedThisFight * 3); },
  },
  arsenal: {
    name: "アーセナル",
    icon: "🎒",
    desc: "カードを3枚引く",
    rarity: "rare",
    effect(game) { game.drawCards(3); },
  },
  execute: {
    name: "エクスキュート",
    icon: "🗡️",
    desc: "敵の減ったHP分ダメージ",
    rarity: "rare",
    effect(game) {
      const lost = game.monster.maxHp - game.monster.hp;
      game.dealDirectDamage(lost);
    },
  },
  berserk: {
    name: "バーサーク",
    icon: "😤",
    desc: "クリックダメージ +5、被ダメ+1",
    rarity: "rare",
    effect(game) { game.dmgBonus += 5; },
  },

  // --- レジェンド ---
  obliterate: {
    name: "殲滅",
    icon: "☄️",
    desc: "即座に 30 ダメージ",
    rarity: "legendary",
    effect(game) { game.dealDirectDamage(30); },
  },
  infiniteEdge: {
    name: "無限刃",
    icon: "♾️",
    desc: "クリックダメージ x3",
    rarity: "legendary",
    effect(game) { game.dmgMultiplier *= 3; },
  },
};

// ========== Monster Definitions ==========
const MONSTER_POOL = [
  { name: "スライム",    icon: "🟢", baseHp: 10 },
  { name: "ゴブリン",    icon: "👺", baseHp: 15 },
  { name: "コウモリ",    icon: "🦇", baseHp: 12 },
  { name: "スケルトン",  icon: "💀", baseHp: 18 },
  { name: "オーク",      icon: "👹", baseHp: 25 },
  { name: "ウルフ",      icon: "🐺", baseHp: 20 },
  { name: "ゴーレム",    icon: "🗿", baseHp: 35 },
  { name: "ドラゴン",    icon: "🐉", baseHp: 50 },
  { name: "デーモン",    icon: "😈", baseHp: 45 },
  { name: "リッチ",      icon: "🧙", baseHp: 40 },
];

// ========== Game State ==========
const game = {
  wave: 1,
  monstersDefeated: 0,
  baseDamage: 1,
  dmgBonus: 0,
  dmgMultiplier: 1,
  cardsPlayedThisFight: 0,
  handSize: 5,

  monster: null,

  // Deck
  drawPile: [],
  hand: [],
  discardPile: [],

  // Reward
  rewardChoices: [],
  isRewardPhase: false,

  init() {
    const startDeck = [
      ...Array(5).fill("strike"),
      ...Array(3).fill("guard"),
    ];
    this.drawPile = this.shuffle([...startDeck]);
    this.spawnMonster();
    this.drawHand();
    this.render();
  },

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  // ---- Monster ----
  spawnMonster() {
    const template = MONSTER_POOL[Math.floor(Math.random() * MONSTER_POOL.length)];
    const hpScale = 1 + (this.wave - 1) * 0.5;
    const hp = Math.floor(template.baseHp * hpScale);
    this.monster = {
      name: template.name,
      icon: template.icon,
      hp,
      maxHp: hp,
    };
  },

  // ---- Combat ----
  clickMonster() {
    if (!this.monster || this.monster.hp <= 0 || this.isRewardPhase) return;
    const dmg = (this.baseDamage + this.dmgBonus) * this.dmgMultiplier;
    this.monster.hp = Math.max(0, this.monster.hp - dmg);
    this.showFloatingNumber(dmg);
    this.shakeMonster();

    if (this.monster.hp <= 0) {
      this.onMonsterDefeated();
    }
    this.render();
  },

  dealDirectDamage(amount) {
    if (!this.monster || this.monster.hp <= 0) return;
    this.monster.hp = Math.max(0, this.monster.hp - amount);
    this.showFloatingNumber(amount);
    if (this.monster.hp <= 0) {
      this.onMonsterDefeated();
    }
  },

  onMonsterDefeated() {
    this.monstersDefeated++;
    this.showReward();
  },

  // ---- Reward Phase ----
  showReward() {
    this.isRewardPhase = true;
    // Pick 3 random reward cards (weighted by rarity)
    const pool = this.getRewardPool();
    this.rewardChoices = [];
    for (let i = 0; i < 3; i++) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      this.rewardChoices.push(pick);
    }
    this.render();
    document.getElementById("reward-overlay").classList.remove("hidden");
  },

  getRewardPool() {
    const pool = [];
    const nonStarter = Object.entries(CARD_DEFS).filter(
      ([id]) => id !== "strike" && id !== "guard"
    );
    for (const [id, def] of nonStarter) {
      let weight = 0;
      if (def.rarity === "common") weight = 5;
      else if (def.rarity === "rare") weight = 3;
      else if (def.rarity === "legendary") weight = 1;
      for (let i = 0; i < weight; i++) pool.push(id);
    }
    return pool;
  },

  pickReward(cardId) {
    this.discardPile.push(cardId);
    this.advanceToNextMonster();
  },

  skipReward() {
    this.advanceToNextMonster();
  },

  advanceToNextMonster() {
    this.isRewardPhase = false;
    document.getElementById("reward-overlay").classList.add("hidden");

    // Discard hand
    for (const card of this.hand) {
      this.discardPile.push(card.id);
    }
    this.hand = [];

    // Reset combat bonuses
    this.dmgBonus = 0;
    this.dmgMultiplier = 1;
    this.cardsPlayedThisFight = 0;

    // Reshuffle entire deck
    this.drawPile = this.shuffle([...this.drawPile, ...this.discardPile]);
    this.discardPile = [];

    // Next wave
    this.wave++;
    this.spawnMonster();
    this.drawHand();
    this.render();
  },

  // ---- Deck ----
  drawCards(count) {
    for (let i = 0; i < count; i++) {
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) return;
        this.drawPile = this.shuffle([...this.discardPile]);
        this.discardPile = [];
      }
      this.hand.push({ id: this.drawPile.pop(), used: false });
    }
  },

  drawHand() {
    this.drawCards(this.handSize);
  },

  playCard(index) {
    const card = this.hand[index];
    if (!card || card.used || this.isRewardPhase) return;
    if (this.monster && this.monster.hp <= 0) return;
    card.used = true;
    this.cardsPlayedThisFight++;
    const def = CARD_DEFS[card.id];
    if (def && def.effect) def.effect(this);
    this.render();
  },

  // ---- VFX ----
  showFloatingNumber(amount) {
    const container = document.getElementById("floating-numbers");
    const el = document.createElement("div");
    el.className = "float-number";
    el.textContent = `-${amount}`;
    el.style.left = `${30 + Math.random() * 40}%`;
    el.style.top = `${20 + Math.random() * 30}%`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  },

  shakeMonster() {
    const sprite = document.getElementById("monster-sprite");
    sprite.classList.remove("shake");
    void sprite.offsetWidth; // reflow
    sprite.classList.add("shake");
  },

  // ========== Rendering ==========
  render() {
    const dmg = (this.baseDamage + this.dmgBonus) * this.dmgMultiplier;

    // Stats
    document.getElementById("wave-display").textContent = `Wave ${this.wave}`;
    document.getElementById("damage-display").textContent = `⚔️ ${dmg} dmg`;
    document.getElementById("defeated-display").textContent = `💀 ${this.monstersDefeated} 体撃破`;

    // Monster
    if (this.monster) {
      document.getElementById("monster-name").textContent =
        `${this.monster.icon} ${this.monster.name}`;
      const pct = Math.max(0, (this.monster.hp / this.monster.maxHp) * 100);
      document.getElementById("hp-bar").style.width = `${pct}%`;
      document.getElementById("hp-text").textContent =
        `${this.monster.hp} / ${this.monster.maxHp}`;
      document.getElementById("monster-sprite").textContent = this.monster.icon;
    }

    // Deck piles
    document.getElementById("draw-count").textContent = this.drawPile.length;
    document.getElementById("discard-count").textContent = this.discardPile.length;

    // Hand info
    const usedCount = this.hand.filter(c => c.used).length;
    document.getElementById("hand-info").textContent =
      `(${this.hand.length - usedCount}/${this.hand.length} 使用可能)`;

    // Hand cards
    const handEl = document.getElementById("hand-cards");
    handEl.innerHTML = "";
    this.hand.forEach((card, i) => {
      const def = CARD_DEFS[card.id];
      const el = document.createElement("div");
      const rarityClass = def.rarity ? ` rarity-${def.rarity}` : "";
      el.className = `card${card.used ? " used" : ""}${rarityClass}`;
      el.innerHTML = `
        <div class="card-icon">${def.icon}</div>
        <div class="card-name">${def.name}</div>
        <div class="card-desc">${def.desc}</div>
      `;
      if (!card.used) {
        el.addEventListener("click", () => this.playCard(i));
      }
      handEl.appendChild(el);
    });

    // Reward cards
    if (this.isRewardPhase) {
      const rewardEl = document.getElementById("reward-cards");
      rewardEl.innerHTML = "";
      this.rewardChoices.forEach((cardId) => {
        const def = CARD_DEFS[cardId];
        const el = document.createElement("div");
        el.className = `card reward-card rarity-${def.rarity}`;
        el.innerHTML = `
          <div class="card-icon">${def.icon}</div>
          <div class="card-name">${def.name}</div>
          <div class="card-desc">${def.desc}</div>
          <div class="card-rarity">${def.rarity.toUpperCase()}</div>
        `;
        el.addEventListener("click", () => this.pickReward(cardId));
        rewardEl.appendChild(el);
      });
    }
  },
};

// ========== Event Listeners ==========
document.getElementById("monster-area").addEventListener("click", () => game.clickMonster());
document.getElementById("skip-reward-btn").addEventListener("click", () => game.skipReward());

// ========== Start ==========
game.init();
