// Chrome插件音频管理
class ChromeAudioManager {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voice = null;
    this.initVoice();
  }
  
  // 初始化语音
  initVoice() {
    const setVoice = () => {
      const voices = this.synthesis.getVoices();
      // 优先选择英语语音
      this.voice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    };
    
    if (this.synthesis.getVoices().length > 0) {
      setVoice();
    } else {
      this.synthesis.addEventListener('voiceschanged', setVoice);
    }
  }
  
  // 朗读单词
  speakWord(text) {
    if (!text) return;
    
    // 停止当前朗读
    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    this.synthesis.speak(utterance);
  }
}