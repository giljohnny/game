// TM BARBER SHOP GAME SYSTEM (SIMPLIFIED PROTOTYPE)

const DAY = 24 * 60 * 60 * 1000;

// -----------------------------
// CONFIG
// -----------------------------

const XP_TIERS = [
  { name: "Bronze", xp: 0, multiplier: 1.0 },
  { name: "Silver", xp: 1000, multiplier: 1.1 },
  { name: "Gold", xp: 3000, multiplier: 1.25 },
  { name: "Platinum", xp: 7000, multiplier: 1.5 },
  { name: "VIP", xp: 12000, multiplier: 2.0 },
];

const COUPONS = [
  { cost: 500, discount: 5 },
  { cost: 1000, discount: 7 },
  { cost: 2000, discount: 10 },
  { cost: 3500, discount: 14 },
];

// -----------------------------
// DATABASE (IN MEMORY)
// -----------------------------

const db = {
  customers: {},
  drops: [],
  transactions: [],
};

// -----------------------------
// HELPERS
// -----------------------------

function getTier(xp) {
  return [...XP_TIERS].reverse().find(t => xp >= t.xp);
}

function now() {
  return Date.now();
}

// -----------------------------
// CUSTOMER INIT
// -----------------------------

function createCustomer(name) {
  db.customers[name] = {
    name,
    xp: 0,
    coins: 0,
    lastVisit: null,
    drops: [],
  };
}

// -----------------------------
// XP + COINS CORE ENGINE
// -----------------------------

function earnXP(customer, amount) {
  customer.xp += amount;
}

function earnCoins(customer, amount) {
  customer.coins += amount;
}

// -----------------------------
// ACTIONS (MORE GAME FEEL)
// -----------------------------

function booking(customer, service, price) {
  const tier = getTier(customer.xp);
  const xpGain = Math.floor(price * 10); // XP scaling
  const coinGain = Math.floor(price * 10 * tier.multiplier);

  earnXP(customer, xpGain);
  earnCoins(customer, coinGain);

  customer.lastVisit = now();

  console.log(`💈 ${customer.name} booked ${service}`);
  console.log(`+${xpGain} XP, +${coinGain} coins`);
}

function review(customer, stars) {
  if (stars !== 5) return;

  earnXP(customer, 50);
  earnCoins(customer, 100);

  console.log(`⭐ 5-star review from ${customer.name} (+XP + coins bonus)`);
}

function streakBonus(customer, daysSinceLastVisit) {
  if (daysSinceLastVisit <= 7) {
    earnCoins(customer, 200);
    earnXP(customer, 100);
    console.log(`🔥 streak bonus for ${customer.name}`);
  }
}

function photoUpload(customer) {
  earnCoins(customer, 150);
  console.log(`📸 photo uploaded reward`);
}

function referral(customer) {
  earnCoins(customer, 500);
  earnXP(customer, 200);
  console.log(`🤝 referral reward`);
}

// -----------------------------
// COIN EXPIRY SYSTEM
// -----------------------------

function decayCoins(customer) {
  if (!customer.lastVisit) return;

  const days = (now() - customer.lastVisit) / DAY;

  if (days > 60) {
    customer.coins = Math.floor(customer.coins * 0.7);
    console.log(`⏳ coin decay applied to ${customer.name}`);
  }
}

// -----------------------------
// COUPON REDEMPTION
// -----------------------------

function redeem(customer, discount) {
  const coupon = COUPONS.find(c => c.discount === discount);

  if (!coupon) return console.log("Invalid coupon");

  if (customer.coins < coupon.cost) {
    return console.log("Not enough coins");
  }

  customer.coins -= coupon.cost;

  console.log(`🎁 ${customer.name} redeemed ${discount}% coupon`);
}

// -----------------------------
// REWARD DROPS (ADMIN)
// -----------------------------

function issueDrop(customer, discount, cost) {
  const drop = {
    id: Math.random().toString(36).slice(2),
    customer: customer.name,
    discount,
    cost,
    createdAt: now(),
    expiresAt: now() + 2 * DAY,
  };

  customer.drops.push(drop);
  db.drops.push(drop);

  console.log(`📦 Drop issued: ${discount}% to ${customer.name}`);
}

// -----------------------------
// AUTO EXPIRE DROPS
// -----------------------------

function expireDrops() {
  const t = now();

  for (const c of Object.values(db.customers)) {
    for (const d of c.drops) {
      if (d.expiresAt < t) {
        earnCoins(c, 100); // fallback reward
      }
    }

    c.drops = c.drops.filter(d => d.expiresAt > t);
  }
}

// -----------------------------
// ADMIN ACTIONS
// -----------------------------

function adminIssueCampaign(discount) {
  for (const c of Object.values(db.customers)) {
    issueDrop(c, discount, COUPONS.find(x => x.discount === discount).cost);
  }
}

// -----------------------------
// DEMO FLOW
// -----------------------------

createCustomer("Alex");
createCustomer("John");

const alex = db.customers["Alex"];
const john = db.customers["John"];

// simulate actions
booking(alex, "haircut", 30);
booking(alex, "beard", 15);
review(alex, 5);

booking(john, "haircut", 50);
review(john, 5);

streakBonus(alex, 3);

redeem(alex, 7);

// admin issues drop
adminIssueCampaign(10);

// expire system
expireDrops();

console.log("\n--- FINAL STATE ---");
console.log(db.customers);
