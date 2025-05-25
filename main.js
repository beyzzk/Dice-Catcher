//Arkaplan müziği için
document.addEventListener("click", function initMusic() {
  const music = document.getElementById("bgMusic");
  music.volume = 0.5;
  music.play();
  document.removeEventListener("click", initMusic); //ekrana ilk tıklamada başlaması için
});

//Başlangıc ekranı
let gameState = "menu"; // "menu", "playing"
//Aksiyona bağlı ses
const collectSound = document.getElementById("collectSound");

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

const charCanvas = document.getElementById("characterCanvas");
const charCtx = charCanvas.getContext("2d");

let playerHealth = 10; //Default olarak 10 canla başlatıyorum
let enemyHealth = 10;
const maxHealth = 10;
let collectedArrows = 0; // Oyuncunun topladığı silah sayısı
let enemyAttackCount = 0; // Düşmanın yapacağı saldırı sayısı

let items = [];
let roundActive = false;
let turn = "none"; // Saldırı sırasının kimde olduğu kontrolü player/enemy
let enemyAttackQueue = 0;
let playerAttackQueue = 0;
const cursorBox = { x: 0, y: 0, size: 50 };

// Kalp kutularını çizme
function renderHearts(id, currentHealth) {
  const container = document.getElementById(id);
  container.innerHTML = "";
  for (let i = 0; i < maxHealth; i++) {
    const heart = document.createElement("i");
    heart.className =
      i < currentHealth ? "fa-solid fa-heart" : "fa-regular fa-heart";
    heart.style = "color: #9600cc;";
    container.appendChild(heart);
  }
}

// Oyuncunun üstüne silahları çizme
function drawPlayerWeapons(count, highlight = false) {
  const container = document.getElementById("playerWeapons");
  const imgSword = document.getElementById("imgArrow");
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const img = document.createElement("img");
    img.src = imgSword.src;
    img.style.width = highlight ? "32px" : "28px";
    container.appendChild(img);
  }
}

// Düşmanın kalpleri üstüne silahları çizme
function drawEnemyWeapons(count, highlight = false) {
  const container = document.getElementById("enemyWeapons");
  const imgSword = document.getElementById("imgArrow");
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const img = document.createElement("img");
    img.src = imgSword.src;
    img.style.width = highlight ? "32px" : "28px";
    container.appendChild(img);
  }
}

// Düşen nesneleri oluşturma (ok,kalp ya da tuzak)
function spawnItem() {
  const x = Math.random() * (canvas.width - 30);
  const y = -30;
  const rand = Math.random();
  let type = "arrow";
  if (rand < 0.33) type = "arrow";
  else if (rand < 0.66) type = "heart";
  else type = "trap";
  items.push({ x, y, size: 40, type });
}

//Sağ tık ile trap kutularını kalbe dönüştürme
canvas.addEventListener("contextmenu", function (e) {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;

  items.forEach((item) => {
    const inside =
      item.x < cursorBox.x + cursorBox.size &&
      item.x + item.size > cursorBox.x &&
      item.y < cursorBox.y + cursorBox.size &&
      item.type === "trap";

    if (inside) {
      item.type = "heart"; // Tuzağı kalbe çevir
    }
  });
});

// Canvas'a tıklanınca olan olaylar
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;

  if (gameState === "menu") {
    // Start butonu
    if (
      cx >= canvas.width / 2 - 75 &&
      cx <= canvas.width / 2 + 75 &&
      cy >= 120 &&
      cy <= 160
    ) {
      gameState = "playing";
      document.getElementById("info").style.display = "none";
      startRound();
    }

    // Settings butonu
    if (
      cx >= canvas.width / 2 - 75 &&
      cx <= canvas.width / 2 + 75 &&
      cy >= 180 &&
      cy <= 220
    ) {
      alert("Ayarlar gelecekte eklenecektir.");
    }
    return;
  }
  if (!roundActive) return;

  items = items.filter((item) => {
    const inside =
      item.x < cursorBox.x + cursorBox.size &&
      item.x + item.size > cursorBox.x &&
      item.y < cursorBox.y + cursorBox.size &&
      item.y + item.size > cursorBox.y;

    if (inside) {
      collectSound.currentTime = 0;
      collectSound.play();
      if (item.type === "arrow") {
        collectedArrows++;
        drawPlayerWeapons(collectedArrows);
      } else if (item.type === "heart") {
        // Kalp toplandıysa düşman hasar alır
        enemyHealth = Math.max(0, enemyHealth - 1);
        renderHearts("enemyHealth", enemyHealth);
        if (enemyHealth === 0) {
          roundActive = false;
          items = [];
          gameOver("Kazandın!");
          return false; // Bu item’ı da siler
        }
      } else if (item.type === "trap") {
        enemyAttackCount++;
        drawEnemyWeapons(enemyAttackCount);
      }
    }
    return !inside;
  });
});

// Mouse hareketi
canvas.addEventListener("mousemove", function (e) {
  const rect = canvas.getBoundingClientRect();
  cursorBox.x = e.clientX - rect.left - cursorBox.size / 2;
  cursorBox.y = e.clientY - rect.top - cursorBox.size / 2;
});

// Canvas üzerine nesneleri çizme
function drawItems() {
  const imgArrow = document.getElementById("imgArrow");
  const imgHeart = document.getElementById("imgHeart");
  const imgTrap = document.getElementById("imgTrap");
  for (let item of items) {
    let img;
    if (item.type === "arrow") img = imgArrow;
    else if (item.type === "heart") img = imgHeart;
    else if (item.type === "trap") img = imgTrap;
    if (img) {
      ctx.drawImage(img, item.x, item.y, item.size, item.size);
    }
  }
}

//Nesneleri toplayan kesikli kareyi çizme
function drawCursorBox() {
  ctx.setLineDash([12, 12]);
  ctx.strokeStyle = "white";
  ctx.strokeRect(cursorBox.x, cursorBox.y, cursorBox.size, cursorBox.size);
  ctx.setLineDash([]);
}

// Ana döngü: animasyonları güncelliyorum
function update() {
  if (roundActive) {
    for (let item of items) {
      item.y += 1.5;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gameState === "menu") {
    drawStartMenu();
  } else if (gameState === "playing") {
    drawItems();
    drawCursorBox();
  }
  requestAnimationFrame(update);
}

//Başlangıc ekranı menüsü
function drawStartMenu() {
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Dice Catcher", canvas.width / 2, 80);

  // Start butonu
  ctx.fillStyle = "#90A4AE";
  ctx.fillRect(canvas.width / 2 - 75, 120, 150, 40);
  ctx.fillStyle = "#263238";
  ctx.fillText("Start", canvas.width / 2, 150);

  // Settings butonu
  ctx.fillStyle = "#90A4AE";
  ctx.fillRect(canvas.width / 2 - 75, 180, 150, 40);
  ctx.fillStyle = "#263238";
  ctx.fillText("Settings", canvas.width / 2, 210);
}

// Yeni tur başlatma
function startRound() {
  enemyAttackCount = Math.floor(Math.random() * 6) + 1;
  collectedArrows = 0;
  drawPlayerWeapons(0);
  drawEnemyWeapons(enemyAttackCount);
  items = [];
  roundActive = true;

  let dropInterval = setInterval(() => {
    if (!roundActive) clearInterval(dropInterval);
    else spawnItem();
  }, 400);

  //10 saniye sürsün ve 10 sn sonra yeni round başlasın
  setTimeout(() => {
    roundActive = false;
    items = [];
    turn = "enemy";
    enemyAttackQueue = enemyAttackCount;
    drawEnemyWeapons(enemyAttackQueue, true);
    drawPlayerWeapons(collectedArrows, false);
    startCombat();
  }, 10000);
}

// Sıralı saldırı sistemi
function startCombat() {
  if (turn === "enemy" && enemyAttackQueue > 0) {
    setTimeout(() => {
      playerHealth = Math.max(0, playerHealth - 1);
      enemyAttackQueue--;
      renderHearts("playerHealth", playerHealth);
      drawEnemyWeapons(enemyAttackQueue, true);
      if (playerHealth === 0) return gameOver("Kaybettin!");
      startCombat();
    }, 600);
  } else if (turn === "enemy" && enemyAttackQueue === 0) {
    turn = "player";
    playerAttackQueue = collectedArrows;
    drawPlayerWeapons(playerAttackQueue, true);
    drawEnemyWeapons(0, false);
    startCombat();
  } else if (turn === "player" && playerAttackQueue > 0) {
    setTimeout(() => {
      enemyHealth = Math.max(0, enemyHealth - 1);
      renderHearts("enemyHealth", enemyHealth);
      drawPlayerWeapons(playerAttackQueue, true);
      if (enemyHealth === 0) {
        drawEnemyWeapons(0);
        return gameOver("Kazandın!");
      }
      playerAttackQueue--;
      drawPlayerWeapons(playerAttackQueue, true);
      startCombat();
    }, 600);
  } else if (turn === "player" && playerAttackQueue === 0) {
    turn = "none";
    setTimeout(startRound, 1500);
  }
}

// Oyun sonu
function gameOver(message) {
  setTimeout(() => {
    alert(message);
    window.location.reload();
  }, 100);
}

// Başlangıç ayarları
renderHearts("playerHealth", playerHealth);
renderHearts("enemyHealth", enemyHealth);
drawPlayerWeapons(0);
update();
