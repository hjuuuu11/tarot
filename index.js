const axios = require('axios');
const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const togetherClient = axios.create({
  baseURL: 'https://api.together.xyz/v1',
  headers: {
    'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

app.get('/', (req, res) => {
  res.render('index'); 
});

app.post('/reading', async (req, res) => {
  const { question, color, cards } = req.body;
  console.log("收到使用者資料:", { question, color, cards });

  if (!question || !color || !cards || cards.length !== 3) {
    return res.status(400).json({ error: "請確認所有欄位已填寫且抽滿三張牌。" });
  }

  // 將三張牌整理為每張一行
  const cardText = cards.map((card, idx) => `第${idx + 1}張：${card}`).join('\n');

  try {
    const response = await togetherClient.post('/chat/completions', {
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      messages: [
        {
          role: "system",
          content: `你是一位擁有十年以上經驗的塔羅牌占卜師，熟悉78張塔羅牌的正位與逆位意義。你能結合心理學、能量與直覺，針對使用者的問題、顏色偏好與三張塔羅牌（含正逆位）提供溫柔、啟發性的解讀。請使用繁體中文，語氣溫暖並具療癒性，逐張分析牌義，最後提供整體能量總結與實際建議。`
        },
        {
          role: "user",
          content:
`請針對以下資訊進行塔羅解讀：

問題：${question}
喜好顏色：${color}
抽到的三張牌如下：
${cardText}

請逐張分析正逆位牌義，並結合整體能量給出啟發性的指引與建議。`
        }
      ],
      max_tokens: 1024,
      temperature: 0.7
    });

    const result = response.data?.choices?.[0]?.message?.content;
    if (!result) {
      throw new Error("API 沒有回傳解讀內容");
    }

    const reading = `${result}`;
    res.json({ result: reading });

  } catch (error) {
    console.error("API 錯誤詳細：", JSON.stringify(error.response?.data || error, null, 2));
    res.status(500).json({ error: "解讀發生錯誤，請稍後再試。" });
  }
});

app.listen(5000, () => {
  console.log("🔮 AI塔羅伺服器正在執行，網址：http://localhost:5000");
});