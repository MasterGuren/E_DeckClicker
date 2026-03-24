// ========== Card Definitions ==========
const CARD_DEFS = {
  // --- スターター ---
  strike: {
    name: "ストライク",
    icon: "⚔️",
    desc: "クリックダメージ +1",
    cost: 1,
    rarity: "common",
    effect(game) { game.dmgBonus += 1; },
  },
  guard: {
    name: "ガード",
    icon: "🛡️",
    desc: "カードを1枚引く",
    cost: 1,
    rarity: "common",
    effect(game) { game.drawCards(1); },
  },

  // --- コモン ---
  heavyStrike: {
    name: "ヘビーストライク",
    icon: "🔨",
    desc: "クリックダメージ +3",
    cost: 2,
    rarity: "common",
    effect(game) { game.dmgBonus += 3; },
  },
  quickDraw: {
    name: "クイックドロー",
    icon: "📥",
    desc: "カードを2枚引く",
    cost: 1,
    rarity: "common",
    effect(game) { game.drawCards(2); },
  },
  bash: {
    name: "バッシュ",
    icon: "💥",
    desc: "即座に 8 ダメージ",
    cost: 2,
    rarity: "common",
    effect(game) { game.dealDirectDamage(8); },
  },
  sharpen: {
    name: "研ぎ澄ます",
    icon: "🔪",
    desc: "クリックダメージ +2",
    cost: 1,
    rarity: "common",
    effect(game) { game.dmgBonus += 2; },
  },
  surge: {
    name: "サージ",
    icon: "🔋",
    desc: "エナジー +2",
    cost: 0,
    rarity: "common",
    effect(game) { game.energy += 2; },
  },

  // --- レア ---
  rage: {
    name: "レイジ",
    icon: "🔥",
    desc: "クリックダメージ x2",
    cost: 2,
    rarity: "rare",
    effect(game) { game.dmgMultiplier *= 2; },
  },
  comboStrike: {
    name: "コンボストライク",
    icon: "⚡",
    desc: "使ったカード数 x3 ダメージ",
    cost: 1,
    rarity: "rare",
    effect(game) { game.dealDirectDamage(game.cardsPlayedThisFight * 3); },
  },
  arsenal: {
    name: "アーセナル",
    icon: "🎒",
    desc: "カードを3枚引く",
    cost: 2,
    rarity: "rare",
    effect(game) { game.drawCards(3); },
  },
  execute: {
    name: "エクスキュート",
    icon: "🗡️",
    desc: "敵の減ったHP分ダメージ",
    cost: 2,
    rarity: "rare",
    effect(game) {
      const lost = game.monster.maxHp - game.monster.hp;
      game.dealDirectDamage(lost);
    },
  },
  berserk: {
    name: "バーサーク",
    icon: "😤",
    desc: "クリックダメージ +5",
    cost: 3,
    rarity: "rare",
    effect(game) { game.dmgBonus += 5; },
  },
  energyBurst: {
    name: "エナジーバースト",
    icon: "💫",
    desc: "エナジー +4",
    cost: 0,
    rarity: "rare",
    effect(game) { game.energy += 4; },
  },

  // --- レジェンド ---
  obliterate: {
    name: "殲滅",
    icon: "☄️",
    desc: "即座に 30 ダメージ",
    cost: 3,
    rarity: "legendary",
    effect(game) { game.dealDirectDamage(30); },
  },
  infiniteEdge: {
    name: "無限刃",
    icon: "♾️",
    desc: "クリックダメージ x3",
    cost: 3,
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
  bestWave: 0,

  // Energy
  energy: 0,
  clickCount: 0,
  clicksPerEnergy: 10,
  drawCost: 1,

  monster: null,

  // Deck
  drawPile: [],
  hand: [],
  discardPile: [],

  // Reward
  rewardChoices: [],
  isRewardPhase: false,

  // Ascend (prestige)
  ascendCount: 0,
  ascendBonusDmg: 0,
  ascendBonusHand: 0,
  ascendMinWave: 5,

  init() {
    this.resetRun();
    this.render();
  },

  resetRun() {
    this.wave = 1;
    this.dmgBonus = 0;
    this.dmgMultiplier = 1;
    this.cardsPlayedThisFight = 0;
    this.baseDamage = 1 + this.ascendBonusDmg;
    this.handSize = 5 + this.ascendBonusHand;
    this.energy = 0;
    this.clickCount = 0;
    this.hand = [];
    this.discardPile = [];

    const startDeck = [
      ...Array(5).fill("strike"),
      ...Array(3).fill("guard"),
    ];
    this.drawPile = this.shuffle([...startDeck]);
    this.spawnMonster();
    this.drawHand();
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

    // Energy from clicks
    this.clickCount++;
    if (this.clickCount >= this.clicksPerEnergy) {
      this.clickCount = 0;
      this.energy++;
    }

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

  // ---- Energy Draw ----
  energyDraw() {
    if (this.energy < this.drawCost) return;
    if (this.isRewardPhase) return;
    if (this.drawPile.length === 0 && this.discardPile.length === 0) return;
    this.energy -= this.drawCost;
    this.drawCards(1);
    this.render();
  },

  // ---- Reward Phase ----
  showReward() {
    this.isRewardPhase = true;
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
    const def = CARD_DEFS[card.id];
    if (def.cost > this.energy) return; // not enough energy
    this.energy -= def.cost;
    card.used = true;
    this.cardsPlayedThisFight++;
    if (def.effect) def.effect(this);
    this.render();
  },

  // ---- Ascend ----
  canAscend() {
    return this.wave >= this.ascendMinWave && !this.isRewardPhase;
  },

  getAscendRewards() {
    const bonusDmg = Math.floor(this.wave / 5);
    const bonusHand = this.wave >= 15 ? 1 : 0;
    return { bonusDmg, bonusHand };
  },

  startAscend() {
    if (!this.canAscend()) return;
    const rewards = this.getAscendRewards();
    const summary = document.getElementById("ascend-summary");
    let text = `<p>Wave ${this.wave} 到達！</p>`;
    text += `<div class="ascend-rewards">`;
    text += `<div class="ascend-reward-item">⚔️ 基礎ダメージ +${rewards.bonusDmg}</div>`;
    if (rewards.bonusHand > 0) {
      text += `<div class="ascend-reward-item">🃏 手札枠 +${rewards.bonusHand}</div>`;
    }
    text += `</div>`;
    text += `<p class="ascend-flavor">全てを捨て、より強く生まれ変わる</p>`;
    summary.innerHTML = text;
    document.getElementById("ascend-overlay").classList.remove("hidden");
  },

  confirmAscend() {
    const rewards = this.getAscendRewards();
    if (this.wave > this.bestWave) this.bestWave = this.wave;
    this.ascendCount++;
    this.ascendBonusDmg += rewards.bonusDmg;
    this.ascendBonusHand += rewards.bonusHand;
    document.getElementById("ascend-overlay").classList.add("hidden");
    this.resetRun();
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
    void sprite.offsetWidth;
    sprite.classList.add("shake");
  },

  // ========== Rendering ==========
  render() {
    const dmg = (this.baseDamage + this.dmgBonus) * this.dmgMultiplier;

    // Stats
    document.getElementById("wave-display").textContent = `Wave ${this.wave}`;
    document.getElementById("damage-display").textContent = `⚔️ ${dmg} dmg`;
    document.getElementById("defeated-display").textContent = `💀 ${this.monstersDefeated} 体撃破`;
    document.getElementById("ascend-count-display").textContent = `🌟 ${this.ascendCount} 覚醒`;

    // Energy display
    const energyFill = document.getElementById("energy-fill");
    const energyText = document.getElementById("energy-text");
    const pctToNext = (this.clickCount / this.clicksPerEnergy) * 100;
    energyFill.style.width = `${pctToNext}%`;
    energyText.textContent = `${this.energy}`;

    // Draw button
    const drawBtn = document.getElementById("draw-btn");
    const canDraw = this.energy >= this.drawCost &&
      (this.drawPile.length > 0 || this.discardPile.length > 0) &&
      !this.isRewardPhase;
    drawBtn.disabled = !canDraw;

    // Ascend button
    const ascBtn = document.getElementById("ascend-btn");
    const ascDesc = document.getElementById("ascend-desc");
    if (this.canAscend()) {
      ascBtn.disabled = false;
      const rewards = this.getAscendRewards();
      ascDesc.textContent = `基礎ダメージ +${rewards.bonusDmg}${rewards.bonusHand > 0 ? `、手札 +${rewards.bonusHand}` : ""} を得てリスタート`;
    } else {
      ascBtn.disabled = true;
      ascDesc.textContent = `Wave ${this.ascendMinWave} 到達で解放`;
    }

    // Ascend permanent bonuses display
    const bonusEl = document.getElementById("ascend-bonuses");
    if (this.ascendBonusDmg > 0 || this.ascendBonusHand > 0) {
      let parts = [];
      if (this.ascendBonusDmg > 0) parts.push(`⚔️+${this.ascendBonusDmg}`);
      if (this.ascendBonusHand > 0) parts.push(`🃏+${this.ascendBonusHand}`);
      bonusEl.textContent = `永続ボーナス: ${parts.join("  ")}`;
    } else {
      bonusEl.textContent = "";
    }

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
      const canPlay = !card.used && this.energy >= def.cost &&
        !(this.monster && this.monster.hp <= 0) && !this.isRewardPhase;
      const el = document.createElement("div");
      const rarityClass = ` rarity-${def.rarity}`;
      const noEnergy = !card.used && this.energy < def.cost ? " no-energy" : "";
      el.className = `card${card.used ? " used" : ""}${rarityClass}${noEnergy}`;
      el.innerHTML = `
        <div class="card-cost-badge">${def.cost}</div>
        <div class="card-icon">${def.icon}</div>
        <div class="card-name">${def.name}</div>
        <div class="card-desc">${def.desc}</div>
      `;
      if (canPlay) {
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
          <div class="card-cost-badge">${def.cost}</div>
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
document.getElementById("ascend-btn").addEventListener("click", () => game.startAscend());
document.getElementById("ascend-confirm-btn").addEventListener("click", () => game.confirmAscend());
document.getElementById("draw-btn").addEventListener("click", () => game.energyDraw());

// ========== Start ==========
game.init();
