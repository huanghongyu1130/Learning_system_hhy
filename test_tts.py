# import asyncio
# import edge_tts

# async def main():
#     text = "你好，這是一段使用 Edge TTS 產生的中文語音。"
#     voice = "zh-CN-XiaoxiaoNeural"  # 台灣女聲示例
#     output_file = "output.mp3"

#     tts = edge_tts.Communicate(text, voice=voice)
#     await tts.save(output_file)
#     print(f"已儲存語音到 {output_file}")

# if __name__ == "__main__":
#     asyncio.run(main())


import asyncio
import shutil
import subprocess
import edge_tts

# --- 設定區 ---
VOICE = "zh-TW-HsiaoChenNeural"
# 播放器指令 (推薦 mpv，因為它對 stdin 串流的支援最好，延遲最低)
# 如果你安裝的是 ffmpeg，可以改成 ["ffplay", "-autoexit", "-", "-nodisp"]
PLAYER_COMMAND = ["mpv", "--no-cache", "--no-terminal", "--", "fd://0"]

class StreamTTS:
    def __init__(self):
        # 檢查是否有安裝播放器
        self.player_available = False
        if shutil.which(PLAYER_COMMAND[0]):
            self.player_available = True
            print(f"[{PLAYER_COMMAND[0]}] 檢測成功，將啟用流式播放模式。")
        else:
            print(f"⚠️ 警告: 未檢測到 {PLAYER_COMMAND[0]}。")
            print(f"請安裝 mpv (winget install mpv) 以獲得最佳流式體驗。")

    async def speak_stream(self, text):
        """
        真正的流式播放：
        不存檔，直接將數據 Pipe 給播放器，達成「邊生成邊說話」。
        """
        if not self.player_available:
            print("錯誤: 找不到播放器，無法流式播放。")
            return

        print(f"[Stream] 準備生成: {text}")
        
        communicate = edge_tts.Communicate(text, VOICE)
        
        # 啟動播放器子進程，準備接收 stdin 數據
        # subprocess.PIPE 讓我們可以從 Python 寫入數據給 mpv
        process = subprocess.Popen(
            PLAYER_COMMAND,
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        try:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    # 一收到音訊塊，馬上寫入播放器
                    # 這裡可能會因為播放器緩衝滿了而稍微阻塞，剛好達成同步
                    if process.stdin:
                        process.stdin.write(chunk["data"])
                        process.stdin.flush()
                        
        except BrokenPipeError:
            # 播放器被使用者手動關閉
            print("播放器已中斷。")
        except Exception as e:
            print(f"串流錯誤: {e}")
        finally:
            # 確保關閉輸入流，讓播放器知道數據傳完了
            if process.stdin:
                process.stdin.close()
            # 等待播放器播完剩餘緩衝
            process.wait()

# --- 測試區塊 ---
if __name__ == "__main__":
    tts = StreamTTS()
    
    if not tts.player_available:
        print("請先安裝 mpv 播放器才能執行此測試。")
    else:
        print("=== 極速流式 TTS 測試 (請戴耳機體驗低延遲) ===")
        print("輸入 'q' 離開")
        
        while True:
            text = input("\n請輸入文字: ")
            if text.lower() == 'q':
                break
            
            # 使用 asyncio 執行
            asyncio.run(tts.speak_stream(text))