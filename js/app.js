// 主应用类
class VocabularyApp {
  constructor() {
    this.currentMode = 'quick';
    this.currentWord = null;
    this.storage = new StorageManager();
    this.api = new APIManager();
    this.audio = new AudioManager();
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.loadStats();
    this.startLearning();
  }
  
  // 事件绑定
  bindEvents() {
    // 模式切换
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchMode(e.target.dataset.mode);
      });
    });
    
    // 操作按钮
    document.getElementById('knowBtn').addEventListener('click', () => this.markWord('know'));
    document.getElementById('unknownBtn').addEventListener('click', () => this.markWord('unknown'));
    document.getElementById('passBtn').addEventListener('click', () => this.passWord());
  }
  
  // 模式切换
  switchMode(mode) {
    this.currentMode = mode;
    this.updateModeUI();
    this.loadNextWord();
  }
  
  // 加载下一个单词
  async loadNextWord() {
    this.currentWord = await this.getNextWord();
    this.displayWord();
  }
  
  // 获取下一个单词（智能频次算法）
  async getNextWord() {
    const words = this.storage.getAllWords();
    if (words.length === 0) {
      return await this.api.getRandomWord();
    }
    
    // 基于频次算法选择单词
    return this.selectWordByFrequency(words);
  }
  
  // 智能频次选择算法
  selectWordByFrequency(words) {
    const weightedWords = words.map(word => ({
      ...word,
      weight: this.calculateWordWeight(word)
    }));
    
    // 加权随机选择
    const totalWeight = weightedWords.reduce((sum, word) => sum + word.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const word of weightedWords) {
      random -= word.weight;
      if (random <= 0) return word;
    }
    
    return weightedWords[0];
  }
  
  // 计算单词权重
  calculateWordWeight(word) {
    const difficultyMultiplier = { 0: 3, 1: 1.5, 2: 0.5 };
    const timeFactor = this.calculateTimeFactor(word.lastReviewed);
    const passPenalty = Math.max(0.1, 1 - (word.passCount * 0.1));
    
    return difficultyMultiplier[word.difficulty] * timeFactor * passPenalty;
  }
}

// 应用启动
const app = new VocabularyApp();