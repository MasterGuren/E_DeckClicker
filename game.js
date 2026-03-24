// ========== Card Definitions ==========
const CARD_DEFS = {
  tap: {
    name: "タップ",
    icon: "👆",
    desc: "クリック力 +1",
    cost: 0,
    effect(game) { game.clickBonus += 1; },
  },
  copper: {
    name: "銅貨",
    icon: "🪙",
    desc: "即座に 3 Gold",
    cost: 0,
    effect(game) { game.addGold(3); },
  },
  doubleTap: {
    name: "ダブルタップ",
    icon: "✌️",
    desc: "クリック力 +3",
    cost: 5,
    effect(game) { game.clickBonus += 3; },
  },
  silver: {
    name: "銀貨",
    icon: "💿",
    desc: "即座に 8 Gold",
    cost: 6,
    effect(game) { game.addGold(8); },
  },
  autoClicker: {
    name: "オートクリッカー",
    icon: "🤖",
    desc: "自動収入 +1/s（永続）",
    cost: 10,
    effect(game) { game.autoIncome += 1; },
  },
  gold: {
    name: "金貨",
    icon: "🥇",
    desc: "即座に 20 Gold",
    cost: 15,
    effect(game) { game.addGold(20); },
  },
  frenzy: {
    name: "フレンジー",
    icon: "🔥",
    desc: "クリック力 x2（このターン）",
    cost: 12,
    effect(game) { game.clickMultiplier *= 2; },
  },
  megaBot: {
    name: "メガボット",
    icon: "⚙️",
    desc: "自動収入 +5/s（永続）",
    cost: 30,
    effect(game) { game.autoIncome += 5; },
  },
  treasure: {
    name: "宝箱",
    icon: "💎",
    desc: "即座に 50 Gold",
    cost: 35,
    effect(game) { game.addGold(50); },
  },
  drawCard: {
    name: "ドローカード",
    icon: "📥",
    desc: "カードを2枚引く",
    cost: 8,
    effect(game) { game.drawCards(2); },
  },
  comboStrike: {
    name: "コンボストライク",
    icon: "⚡",
    desc: "このターンに使ったカード数 x5 Gold",
    cost: 14,
    effect(game) { game.addGold(game.cardsPlayedThisTurn * 5); },
  },
  forge: {
    name: "鍛冶場",
    icon: "🔨",
    desc: "カードを3枚引く",
    cost: 18,
    effect(game) { game.drawCards(3); },
  },
};

// ========== Game State ==========
const game = {
  gold: 0,
  totalGold: 0,
  clickPower: 1,
  clickBonus: 0,
  clickMultiplier: 1,
  autoIncome: 0,
  turn: 1,
  cardsPlayedThisTurn: 0,
  handSize: 5,

  // Deck
  drawPile: [],
  hand: [],
  discardPile: [],

  // Shop
  shopCards: [],
  shopSize: 4,

  init() {
    // Starting deck: 5x タップ, 3x 銅貨
    const startDeck = [
      ...Array(5).fill("tap"),
      ...Array(3).fill("copper"),
    ];
    this.drawPile = this.shuffle([...startDeck]);
    this.drawHand();
    this.refreshShop();
    this.startAutoIncome();
    this.render();
  },

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

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
    if (!card || card.used) return;
    card.used = true;
    this.cardsPlayedThisTurn++;
    const def = CARD_DEFS[card.id];
    if (def && def.effect) def.effect(this);
    this.render();
  },

  endTurn() {
    // Discard hand
    for (const card of this.hand) {
      this.discardPile.push(card.id);
    }
    this.hand = [];
    // Reset turn bonuses
    this.clickBonus = 0;
    this.clickMultiplier = 1;
    this.cardsPlayedThisTurn = 0;
    this.turn++;
    // Draw new hand
    this.drawHand();
    this.render();
  },

  addGold(amount) {
    this.gold += amount;
    this.totalGold += amount;
  },

  click() {
    const power = (this.clickPower + this.clickBonus) * this.clickMultiplier;
    this.addGold(power);
    this.showFloatingNumber(power);
    this.render();
  },

  buyCard(cardId) {
    const def = CARD_DEFS[cardId];
    if (!def || this.gold < def.cost) return;
    this.gold -= def.cost;
    this.discardPile.push(cardId);
    // Remove from shop
    const idx = this.shopCards.indexOf(cardId);
    if (idx !== -1) this.shopCards.splice(idx, 1);
    this.render();
  },

  refreshShop() {
    const available = Object.keys(CARD_DEFS).filter(k => CARD_DEFS[k].cost > 0);
    this.shopCards = [];
    for (let i = 0; i < this.shopSize; i++) {
      const pick = available[Math.floor(Math.random() * available.length)];
      this.shopCards.push(pick);
    }
    this.render();
  },

  startAutoIncome() {
    setInterval(() => {
      if (this.autoIncome > 0) {
        this.addGold(this.autoIncome);
        this.render();
      }
    }, 1000);
  },

  showFloatingNumber(amount) {
    const container = document.getElementById("floating-numbers");
    const el = document.createElement("div");
    el.className = "float-number";
    el.textContent = `+${amount}`;
    el.style.left = `${40 + Math.random() * 20}%`;
    el.style.top = `${30 + Math.random() * 20}%`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  },

  // ========== Rendering ==========
  render() {
    const power = (this.clickPower + this.clickBonus) * this.clickMultiplier;
    document.getElementById("gold-display").textContent = `💰 ${this.gold} Gold`;
    document.getElementById("click-power-display").textContent = `⚡ ${power}x Click`;
    document.getElementById("auto-display").textContent = `🔄 ${this.autoIncome}/s Auto`;
    document.getElementById("turn-display").textContent = `🃏 Turn ${this.turn}`;
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
      el.className = `card${card.used ? " used" : ""}`;
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

    // Shop cards
    const shopEl = document.getElementById("shop-cards");
    shopEl.innerHTML = "";
    this.shopCards.forEach((cardId) => {
      const def = CARD_DEFS[cardId];
      const tooExpensive = this.gold < def.cost;
      const el = document.createElement("div");
      el.className = `shop-card card${tooExpensive ? " too-expensive" : ""}`;
      el.innerHTML = `
        <div class="card-icon">${def.icon}</div>
        <div class="card-name">${def.name}</div>
        <div class="card-desc">${def.desc}</div>
        <div class="card-cost">💰 ${def.cost}</div>
      `;
      if (!tooExpensive) {
        el.addEventListener("click", () => this.buyCard(cardId));
      }
      shopEl.appendChild(el);
    });
  },
};

// ========== Event Listeners ==========
document.getElementById("click-btn").addEventListener("click", () => game.click());
document.getElementById("end-turn-btn").addEventListener("click", () => game.endTurn());
document.getElementById("refresh-shop-btn").addEventListener("click", () => game.refreshShop());

// ========== Start ==========
game.init();
