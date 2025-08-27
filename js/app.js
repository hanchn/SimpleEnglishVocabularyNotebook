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
  
  // 加载统计数据
  loadStats() {
    const stats = this.storage.getStats();
    if (stats) {
      document.getElementById('totalWords').textContent = stats.totalWords || 0;
      document.getElementById('streakDays').textContent = stats.streakDays || 0;
    } else {
      // 没有统计数据时显示空白或提示
      document.getElementById('totalWords').textContent = '-';
      document.getElementById('streakDays').textContent = '-';
    }
  }
  
  // 更新统计数据
  updateStats(isCorrect) {
    let stats = this.storage.getStats();
    
    // 如果没有统计数据，初始化
    if (!stats) {
      this.storage.initializeStats();
      stats = this.storage.getStats();
    }
    
    stats.totalReviews++;
    
    if (isCorrect) {
      stats.correctAnswers++;
    }
    
    stats.accuracy = Math.round((stats.correctAnswers / stats.totalReviews) * 100);
    stats.totalWords = this.storage.getAllWords().length;
    
    // 更新连续天数
    const today = new Date().toDateString();
    if (stats.lastStudyDate !== today) {
      if (stats.lastStudyDate === new Date(Date.now() - 86400000).toDateString()) {
        stats.streakDays++;
      } else {
        stats.streakDays = 1;
      }
      stats.lastStudyDate = today;
    }
    
    this.storage.updateStats(stats);
    this.loadStats();
  }
  
  // 开始学习
  async startLearning() {
    this.showLoading();
    await this.loadNextWord();
  }
  
  // 显示加载状态
  showLoading() {
    const learningArea = document.getElementById('learningArea');
    learningArea.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>正在加载单词...</p>
      </div>
    `;
  }
  
  // 模式切换
  switchMode(mode) {
    this.currentMode = mode;
    this.updateModeUI();
    this.loadNextWord();
  }
  
  // 更新模式UI
  updateModeUI() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${this.currentMode}"]`).classList.add('active');
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
      try {
        return await this.api.getRandomWord();
      } catch (error) {
        console.error('获取新单词失败:', error);
        throw new Error('无法获取单词数据，请检查网络连接');
      }
    }
    
    // 基于频次算法选择单词
    return this.selectWordByFrequency(words);
  }
  
  // 开始学习
  async startLearning() {
    this.showLoading();
    try {
      await this.loadNextWord();
    } catch (error) {
      this.showError(error.message || '加载单词失败');
    }
  }
  
  // 加载下一个单词
  async loadNextWord() {
    try {
      this.currentWord = await this.getNextWord();
      this.displayWord();
    } catch (error) {
      this.showError(error.message || '加载单词失败');
    }
  }
  
  // 显示单词 - 添加数据验证
  displayWord() {
    if (!this.currentWord || !this.currentWord.word) {
      this.showError('单词数据加载失败');
      return;
    }
    
    // 确保meanings数组存在且不为空
    if (!this.currentWord.meanings || this.currentWord.meanings.length === 0) {
      this.currentWord.meanings = [{
        partOfSpeech: 'unknown',
        definition: '暂无释义',
        example: ''
      }];
    }
    
    const learningArea = document.getElementById('learningArea');
    
    switch (this.currentMode) {
      case 'quick':
        this.displayQuickMode();
        break;
      case 'fill':
        this.displayFillMode();
        break;
      case 'example':
        this.displayExampleMode();
        break;
    }
  }
  
  // 快速背诵模式 - 添加安全访问
  displayQuickMode() {
    const learningArea = document.getElementById('learningArea');
    const meaning = this.currentWord.meanings[0] || {
      partOfSpeech: 'unknown',
      definition: '暂无释义',
      example: ''
    };
    
    const pronunciation = this.currentWord.pronunciation || '[暂无音标]';
    
    learningArea.innerHTML = `
      <div class="word-card fade-in">
        <div class="word-text">${this.currentWord.word}</div>
        <div class="word-pronunciation">
          ${pronunciation}
          <button class="audio-btn" onclick="app.playAudio('${this.currentWord.word}')">
            🔊
          </button>
        </div>
        <div class="word-meaning">
          <strong>${meaning.partOfSpeech}</strong>: ${meaning.definition}
        </div>
        ${meaning.example ? `<div class="word-example">"${meaning.example}"</div>` : ''}
      </div>
    `;
  }
  
  // 填空模式 - 添加安全访问
  displayFillMode() {
    const learningArea = document.getElementById('learningArea');
    const word = this.currentWord.word;
    const blankedWord = this.createBlankedWord(word);
    const pronunciation = this.currentWord.pronunciation || '[暂无音标]';
    
    learningArea.innerHTML = `
      <div class="word-card fade-in">
        <div class="fill-blank">${blankedWord}</div>
        <input type="text" class="fill-input" placeholder="填入单词" 
               onkeypress="if(event.key==='Enter') app.checkFillAnswer(this.value)">
        <div class="word-pronunciation">
          ${pronunciation}
          <button class="audio-btn" onclick="app.playAudio('${this.currentWord.word}')">
            🔊
          </button>
        </div>
      </div>
    `;
  }
  
  // 例句学习模式 - 添加安全访问
  displayExampleMode() {
    const learningArea = document.getElementById('learningArea');
    const meaning = this.currentWord.meanings[0] || {
      partOfSpeech: 'unknown',
      definition: '暂无释义',
      example: ''
    };
    const pronunciation = this.currentWord.pronunciation || '[暂无音标]';
    
    learningArea.innerHTML = `
      <div class="word-card fade-in">
        <div class="word-text">${this.currentWord.word}</div>
        <div class="word-pronunciation">
          ${pronunciation}
          <button class="audio-btn" onclick="app.playAudio('${this.currentWord.word}')">
            🔊
          </button>
        </div>
        <div class="word-meaning">
          <strong>${meaning.partOfSpeech}</strong>: ${meaning.definition}
        </div>
        ${meaning.example ? `
          <div class="word-example">
            "${meaning.example}"
            <button class="audio-btn" onclick="app.playAudio('${meaning.example}')">
              🔊
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  // 添加错误显示方法
  showError(message) {
    const learningArea = document.getElementById('learningArea');
    learningArea.innerHTML = `
      <div class="error-message">
        <p>❌ ${message}</p>
        <button onclick="app.startLearning()" class="retry-btn">重试</button>
      </div>
    `;
  }
  
  // 创建填空单词
  createBlankedWord(word) {
    const blankCount = Math.ceil(word.length * 0.4); // 隐藏40%的字母
    const indices = [];
    
    while (indices.length < blankCount) {
      const index = Math.floor(Math.random() * word.length);
      if (!indices.includes(index)) {
        indices.push(index);
      }
    }
    
    return word.split('').map((char, index) => 
      indices.includes(index) ? '<span class="blank"></span>' : char
    ).join('');
  }
  
  // 检查填空答案
  checkFillAnswer(answer) {
    if (answer.toLowerCase() === this.currentWord.word.toLowerCase()) {
      this.markWord('know');
    } else {
      this.markWord('unknown');
    }
  }
  
  // 播放音频
  playAudio(text) {
    this.audio.speakWord(text);
  }
  
  // 标记单词
  markWord(result) {
    if (!this.currentWord) return;
    
    // 更新单词数据
    this.currentWord.reviewCount++;
    this.currentWord.lastReviewed = new Date().toISOString();
    
    if (result === 'know') {
      this.currentWord.difficulty = Math.max(0, this.currentWord.difficulty - 1);
    } else {
      this.currentWord.difficulty = Math.min(2, this.currentWord.difficulty + 1);
    }
    
    // 保存单词
    this.storage.saveWord(this.currentWord);
    
    // 更新统计
    this.updateStats(result === 'know');
    
    // 加载下一个单词
    this.loadNextWord();
  }
  
  // Pass按钮
  passWord() {
    if (!this.currentWord) return;
    
    this.currentWord.passCount++;
    this.currentWord.frequency = Math.max(0.1, this.currentWord.frequency - 0.1);
    this.storage.saveWord(this.currentWord);
    
    this.loadNextWord();
  }
}

// 应用启动
const app = new VocabularyApp();