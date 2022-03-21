process.env.NTBA_FIX_319 = 1;

const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const fs = require('fs');

// replace the value below with the Telegram token you receive from @BotFather
const token = "5141832459:AAE03nw4fUh6GW56YRvcvF_6m5UpCO3UtOo";

// Create a bot that uses 'polling' to fetch new updates

const bot = new TelegramBot(token, { polling: true });

let intervalId;

let lastCheck = "";

let chatId = "";

function getDate() {
  let date_ob = new Date();
  return (
    ("0" + date_ob.getDate()).slice(-2) +
    "---" +
    date_ob.getHours() +
    ":" +
    date_ob.getMinutes()
  );
}

function getIgnor() {
  return fs.readFileSync("ignorItems.txt", "utf8").split(',')
}

async function start() {
  const browser= await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.goto(
    "https://by.wildberries.ru/catalog/0/search.aspx?search=премиальная+машинка+hot+wheels"
  );

  try {
    await page.waitForSelector(".product-card");
  } catch (error) {
    console.log("item not found", error);
  }

  const items = await page.$$eval(
    ".product-card a.product-card__main",
    (items) => items.map((item) => item.href)
  );

  console.log(items, getIgnor());

  items.forEach((item) => {
    if (getIgnor().some(el => item.includes(el))) return;
    bot.sendMessage(chatId, item);
  });

  lastCheck = getDate();

  console.log(lastCheck);

  await browser.close();
}

bot.onText(/\/start/, (msg) => {
  chatId = msg.chat.id;
  bot.sendMessage(chatId, "Started");
  console.log("started", getDate());
  intervalId && clearInterval(intervalId);
  start();
  intervalId = setInterval(start, 600000);
});

bot.onText(/\/lastCheck/, (msg) => {
  chatId = msg.chat.id;
  bot.sendMessage(chatId, lastCheck);
});

bot.onText(/\/ignore (.+)/, (msg, match) => {
  chatId = msg.chat.id;
  fs.appendFileSync("ignorItems.txt", `,${match[1]}`);
  bot.sendMessage(chatId, `,${match[1]} added`);
});
