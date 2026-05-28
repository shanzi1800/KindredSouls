#!/usr/bin/env python3
"""
Kindred Souls - AI 情感解读语音生成 Pipeline v2
=================================================
真实数据流：三引擎(Node.js bridge) → DeepSeek AI → Edge TTS

用法：
  python3 kindredsouls-voice-v2.py "1990-03-15" "1985-10-26" "小美" "山子"
  python3 kindredsouls-voice-v2.py --demo   # 用内置 demo 数据
"""

import edge_tts
import asyncio
import json
import os
import subprocess
import sys
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

# ═════════════════════════════════════════
# 配置
# ═════════════════════════════════════════

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
LOCAL_API_URL = "http://localhost:3001/api/ai-insight"

SCRIPT_DIR = Path(__file__).parent
BRIDGE_PATH = SCRIPT_DIR / "server" / "calc-bridge.cjs"
OUTPUT_DIR = SCRIPT_DIR / "output" / "voice"

VOICES = {
    # Chinese
    "gentle_female": "zh-CN-XiaoxiaoNeural",
    "warm_male": "zh-CN-YunyangNeural",
    "cheerful_female": "zh-CN-XiaoyiNeural",
    "sunny_male": "zh-CN-YunxiNeural",
    # French
    "french_female": "fr-FR-DeniseNeural",
    "french_male": "fr-FR-HenriNeural",
    "french_chic": "fr-FR-EloiseNeural",
    # Spanish
    "spanish_female": "es-ES-ElviraNeural",
    "spanish_male": "es-ES-AlvaroNeural",
    "spanish_latam": "es-MX-SofiaNeural",
}

# ═════════════════════════════════════════
# 三引擎计算（Node.js bridge）
# ═════════════════════════════════════════

def calculate_compatibility(date1: str, date2: str) -> Dict[str, Any]:
    """调用 Node.js bridge 计算三引擎合盘（真实算法）"""
    result = subprocess.run(
        ["node", str(BRIDGE_PATH), date1, date2],
        capture_output=True, text=True, timeout=10,
    )
    if result.returncode != 0:
        raise RuntimeError(f"计算失败: {result.stderr.strip()}")
    return json.loads(result.stdout)

# ═════════════════════════════════════════
# AI 解读（优先本地 API，fallback DeepSeek 直调）
# ═════════════════════════════════════════

async def get_ai_insight(
    date1: str, date2: str,
    overall: int, dims: Dict[str, int],
    bazi_summary: str, zodiac_summary: str, iching_summary: str,
    lang: str = "zh",
) -> str:
    """获取 AI 情感解读文案"""

    # 优先尝试本地 API server（有缓存）
    try:
        import urllib.request
        payload = json.dumps({
            "d1": date1, "d2": date2,
            "overall": overall, "dims": dims,
            "bazi": bazi_summary, "zodiac": zodiac_summary, "iching": iching_summary,
            "lang": lang,
        }).encode()
        req = urllib.request.Request(
            LOCAL_API_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            if data.get("insight"):
                return data["insight"]
    except Exception:
        pass  # fallback to direct API call

    # Direct DeepSeek call
    if not DEEPSEEK_API_KEY:
        return "（未配置 DEEPSEEK_API_KEY，使用内置文案）\n\n你们的合盘显示出独特的能量共振。命理揭示的是潜能而非定数，每一段美好的关系都是从愿意尝试开始的。"

    system_prompt = {
        "zh": (
            "你是 KindredSouls 的 AI 情感顾问。用户输入了一对情侣的命理数据，"
            "请用温暖、专业、积极的语气，给出3-5句话的关系洞察。"
            "只用中文输出。不要预测分手或负面结局，始终给予希望和具体行动建议。"
        ),
        "en": (
            "You are the AI relationship advisor for KindredSouls. Based on the couple's "
            "compatibility data, give 3-5 sentences of warm, professional, and positive "
            "relationship insight. Only respond in English. Never predict breakups."
        ),
        "fr": (
            "Tu es le conseiller sentimental IA de KindredSouls. Basé sur les données "
            "de compatibilité du couple, donne 3-5 phrases d'insight chaleureux, "
            "professionnel et positif. Réponds uniquement en français. Ne prédis jamais "
            "de rupture. Donne toujours de l'espoir et des conseils pratiques."
        ),
        "es": (
            "Eres el consejero sentimental IA de KindredSouls. Basado en los datos "
            "de compatibilidad de la pareja, da 3-5 frases de insight cálido, "
            "profesional y positivo. Responde solo en español. Nunca predigas ruptura. "
            "Siempre da esperanza y consejos prácticos."
        ),
    }[lang]

    user_prompt = (
        f"用户生日: {date1}，TA生日: {date2}\n"
        f"综合分: {overall}/100\n"
        f"四维度: 爱情 {dims['love']} | 沟通 {dims['communication']} | "
        f"默契 {dims['chemistry']} | 稳定 {dims['stability']}\n"
        f"八字: {bazi_summary}\n星座: {zodiac_summary}\n易经: {iching_summary}"
    )

    try:
        import urllib.request
        payload = json.dumps({
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.7,
            "max_tokens": 300,
        }).encode()
        req = urllib.request.Request(
            DEEPSEEK_API_URL,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            },
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read())
            text = data["choices"][0]["message"]["content"].strip()
            # 清洗 emoji
            import re
            text = re.sub(r"[\u2640-\u26FF\u2700-\u27BF]", "", text)
            return text
    except Exception as e:
        return f"（AI 调用失败: {e}）\n\n你们的合盘显示出独特的能量共振。命理揭示的是潜能而非定数。"

# ═════════════════════════════════════════
# Edge TTS 语音合成
# ═════════════════════════════════════════

async def synthesize_voice(text: str, voice: str = "zh-CN-XiaoxiaoNeural") -> str:
    """生成语音文件，返回路径"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = OUTPUT_DIR / f"insight_{timestamp}.mp3"

    communicate = edge_tts.Communicate(text=text, voice=voice)
    await communicate.save(str(output_file))
    return str(output_file)

# ═════════════════════════════════════════
# 主流程
# ═════════════════════════════════════════

async def run(
    date1: str, date2: str,
    name_a: str = "用户", name_b: str = "TA",
    voice_style: str = "gentle_female",
    lang: str = "zh",
) -> Dict[str, Any]:
    print("🎙️  KindredSouls Voice Pipeline v2")
    print("=" * 50)

    # 1. 三引擎计算
    print(f"\n📊 计算合盘: {name_a}({date1}) × {name_b}({date2})")
    calc = calculate_compatibility(date1, date2)

    overall = calc["overall"]
    engines = calc["engines"]
    dims = calc["dimensions"]

    print(f"  八字: {engines['bazi']['score']}  星座: {engines['zodiac']['score']}  易经: {engines['iching']['score']}")
    print(f"  综合: {overall}/100")
    print(f"  维度: 爱情{dims['love']} 沟通{dims['communication']} 默契{dims['chemistry']} 稳定{dims['stability']}")

    # 2. AI 解读
    print("\n🤖 生成 AI 情感解读...")
    insight = await get_ai_insight(
        date1, date2, overall, dims,
        engines["bazi"]["summary"],
        engines["zodiac"]["summary"],
        engines["iching"]["summary"],
        lang,
    )
    print(f"  ✅ {len(insight)}字: {insight[:60]}...")

    # 3. 语音合成
    voice = VOICES.get(voice_style, VOICES["gentle_female"])
    print(f"\n🎙️  合成语音 ({voice_style})...")
    audio_path = await synthesize_voice(insight, voice)
    print(f"  ✅ {audio_path}")

    # 4. 保存结果
    result = {
        "name_a": name_a, "name_b": name_b,
        "date_a": date1, "date_b": date2,
        "overall": overall,
        "engines": {k: v["score"] for k, v in engines.items()},
        "dimensions": dims,
        "insight": insight,
        "audio_path": audio_path,
        "voice": voice_style,
        "generated_at": datetime.now().isoformat(),
    }

    json_path = audio_path.replace(".mp3", ".json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  ✅ 数据: {json_path}")

    # 5. 摘要
    print("\n" + "=" * 50)
    print("🎉 完成！")
    print(f"  📊 综合分: {overall}")
    print(f"  📝 文案: {len(insight)}字")
    print(f"  🎙️  音频: {audio_path}")
    print(f"\n💡 用 QuickTime 或 afplay 打开试听:")
    print(f"   afplay '{audio_path}'")

    return result

async def main():
    parser = argparse.ArgumentParser(description="KindredSouls AI Voice Pipeline v2")
    parser.add_argument("date1", nargs="?", help="用户A生日 YYYY-MM-DD")
    parser.add_argument("date2", nargs="?", help="用户B生日 YYYY-MM-DD")
    parser.add_argument("--name-a", default="用户", help="用户A名字")
    parser.add_argument("--name-b", default="TA", help="用户B名字")
    parser.add_argument("--voice", default="gentle_female", choices=list(VOICES.keys()))
    parser.add_argument("--demo", action="store_true", help="用内置 demo 数据")
    parser.add_argument("--lang", default="zh", choices=["zh", "en", "fr", "es"])
    args = parser.parse_args()

    if args.demo:
        await run("1990-03-15", "1985-10-26", "小美", "山子", args.voice, args.lang)
    elif args.date1 and args.date2:
        await run(args.date1, args.date2, args.name_a, args.name_b, args.voice, args.lang)
    else:
        parser.print_help()
        print("\n示例:")
        print('  python3 kindredsouls-voice-v2.py --demo')
        print('  python3 kindredsouls-voice-v2.py "1990-03-15" "1985-10-26" "小美" "山子"')
        print('  python3 kindredsouls-voice-v2.py "1990-03-15" "1985-10-26" --voice warm_male')

if __name__ == "__main__":
    asyncio.run(main())
