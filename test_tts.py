import asyncio
import edge_tts

async def main():
    text = "你好，這是一段使用 Edge TTS 產生的中文語音。"
    voice = "zh-TW-HsiaoChenNeural"  # 台灣女聲示例
    output_file = "output.mp3"

    tts = edge_tts.Communicate(text, voice=voice)
    await tts.save(output_file)
    print(f"已儲存語音到 {output_file}")

if __name__ == "__main__":
    asyncio.run(main())
