const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { setCache, getCache } = require("./cache");

const app = express();
app.use(cors());

const API_KEY = "test_023179838b32932db08918df29bda8a915ed1f3c98d52523a900516f5a71b475efe8d04e6d233bd35cf2fabdeb93fb0d";
const BASE_URL = "https://open.api.nexon.com/maplestory/v1";
const headers = { "x-nxopen-api-key": API_KEY };

// 검색데이터
app.get("/character", async (req, res) => {
  const { name } = req.query;
  console.log(name);
  if (!name) return res.status(400).json({ error: "Missing character name" });

  // 캐시 확인
  const cacheKey = `character:${name}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    // 1. ocid 가져오기
    const idRes = await axios.get(`${BASE_URL}/id?character_name=${name}`, { headers });
    const ocidValue = idRes.data.ocid;

    // 2. 필요한 API 동시에 호출
    const [basicRes, statRes, itemRes] = await Promise.all([
      axios.get(`${BASE_URL}/character/basic?ocid=${ocidValue}`, { headers }),
      axios.get(`${BASE_URL}/character/stat?ocid=${ocidValue}`, { headers }),
      axios.get(`${BASE_URL}/character/item-equipment?ocid=${ocidValue}`, { headers }),
    ]);

    const responseData = {
      basicRes: basicRes.data,
      statRes: statRes.data,
      itemRes: itemRes.data,
    };


    // 캐시에 저장 (예: 1시간 유효)
    setCache(cacheKey, responseData, 1000 * 60 * 60);

    // res.json({ data: response.data, cached: false });
    res.json({ ...responseData, cached: false });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "API request failed" });
  }
});

// 랭킹데이터
app.get("/rank", async (req, res) => {
  console.log(req, res);
  const { world_name = "스카니아", page = 1 } = req.query;
  const cacheKey = `rank:${world_name}:${page}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const response = await axios.get(`${BASE_URL}/ranking/overall`, {
      headers,
      params: { world_name, page },
    });

    const responseData = response.data;

    // 캐시에 저장 (30분)
    setCache(cacheKey, responseData, 1000 * 60 * 30);

    res.json({ ...responseData, cached: false });
  } catch (err) {
    console.error("❌ Rank API Error:", err.message);
    res.status(500).json({ error: "Failed to fetch rank data" });
  }
});
app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});