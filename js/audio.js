// 增强的音频管理
class AudioManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.audioCache = new Map();
        this.audioBasePath = './audio/';
    }
    
    // 播放本地音频文件
    async playAudioFile(audioFile) {
        if (!audioFile) {
            return false;
        }
        
        try {
            let audio;
            if (this.audioCache.has(audioFile)) {
                audio = this.audioCache.get(audioFile);
            } else {
                audio = new Audio(this.audioBasePath + audioFile);
                this.audioCache.set(audioFile, audio);
            }
            
            await audio.play();
            return true;
        } catch (error) {
            console.warn('本地音频播放失败:', error);
            return false;
        }
    }
    
    // 播放单词发音（优先本地音频）
    async speakWord(word, audioFile = null, options = {}) {
        this.stop();
        
        // 优先尝试播放本地音频
        if (audioFile) {
            const success = await this.playAudioFile(audioFile);
            if (success) return;
        }
        
        // 回退到语音合成
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = options.rate || 1.0;
        utterance.lang = options.lang || 'en-US';
        utterance.volume = options.volume || 1.0;
        
        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
    }
    
    // 播放例句（支持本地音频）
    async speakSentence(sentence, audioFile = null, options = {}) {
        this.stop();
        
        if (audioFile) {
            const success = await this.playAudioFile(audioFile);
            if (success) return;
        }
        
        // 回退到语音合成
        this.speakWord(sentence, null, { ...options, rate: 0.8 });
    }
    
    // 停止播放
    stop() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        
        // 停止所有音频
        this.audioCache.forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }
    
    // 预加载音频文件
    preloadAudio(audioFiles) {
        audioFiles.forEach(audioFile => {
            if (!this.audioCache.has(audioFile)) {
                const audio = new Audio(this.audioBasePath + audioFile);
                audio.preload = 'metadata';
                this.audioCache.set(audioFile, audio);
            }
        });
    }
}