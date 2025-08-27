// 音频管理
class AudioManager {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
  }
  
  // 播放单词发音
  speakWord(word, options = {}) {
    this.stop();
    
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = options.rate || 1.0;
    utterance.lang = options.lang || 'en-US';
    utterance.volume = options.volume || 1.0;
    
    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }
  
  // 播放例句
  speakSentence(sentence, options = {}) {
    this.speakWord(sentence, { ...options, rate: 0.8 });
  }
  
  // 停止播放
  stop() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }
}