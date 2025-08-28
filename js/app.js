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
  // 在bindEvents方法中添加
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
    
    // 开始学习按钮
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        console.log('开始学习按钮被点击'); // 调试用
        const welcomeMsg = document.querySelector('.welcome-message');
        const controls = document.getElementById('controls');
        
        if (welcomeMsg) welcomeMsg.style.display = 'none';
        if (controls) {
          controls.style.display = 'flex';
          console.log('控制按钮已显示'); // 调试用
        }
        
        this.startLearning();
      });
    }
    
    // 获取新单词按钮
    const newWordBtn = document.getElementById('newWordBtn');
    if (newWordBtn) {
      newWordBtn.addEventListener('click', async () => {
        try {
          this.currentWord = await this.api.getRandomWord();
          this.displayWord();
        } catch (error) {
          this.showError('获取新单词失败');
        }
      });
    }
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
  // 显示单词 - 添加图片支持
  async displayWord() {
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
    
    // 获取单词图片
    const image = await this.api.getWordImage(this.currentWord.word);
    this.currentWordImage = image; // 保存图片信息
    
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
  // 快速背诵模式 - 添加图片显示
  displayQuickMode() {
    const learningArea = document.getElementById('learningArea');
    const meaning = this.currentWord.meanings[0] || {
      partOfSpeech: 'unknown',
      definition: '暂无释义',
      example: ''
    };
    
    const pronunciation = this.currentWord.pronunciation || '[暂无音标]';
    const imageHtml = this.currentWordImage ? 
      `<div class="word-image">
        <img src="${this.currentWordImage.url}" alt="${this.currentWordImage.alt}" 
             onerror="this.src='${this.currentWordImage.fallback || this.currentWordImage.url}'" 
             style="max-width: 300px; max-height: 200px; border-radius: 8px; margin: 10px 0;">
      </div>` : '';
    
    learningArea.innerHTML = `
      <div class="word-card fade-in">
        <div class="word-text">${this.currentWord.word}</div>
        <div class="word-pronunciation">
          ${pronunciation}
          <button class="audio-btn" onclick="app.playAudio('${this.currentWord.word}')">
            🔊
          </button>
        </div>
        ${imageHtml}
        <div class="word-meaning">
          <strong>${meaning.partOfSpeech}</strong>: ${meaning.definition}
        </div>
        ${meaning.example ? `<div class="word-example">"${meaning.example}"</div>` : ''}
      </div>
    `;
  }
  
  // 填空模式 - 添加安全访问
  // 更新displayFillMode方法
  displayFillMode() {
    const learningArea = document.getElementById('learningArea');
    const word = this.currentWord.word;
    const blankedWord = this.createBlankedWord(word);
    const pronunciation = this.currentWord.pronunciation || '[暂无音标]';
    const firstMeaning = this.currentWord.meanings[0];
    
    learningArea.innerHTML = `
      <div class="word-card fade-in">
        <div class="fill-exercise">
          <h3>🖊️ 填空练习</h3>
          <div class="word-input-area">
            <input type="text" 
                   id="wordInput" 
                   class="word-input fill-input" 
                   placeholder="请输入单词..."
                   autocomplete="off"
                   spellcheck="false"
                   onkeypress="if(event.key==='Enter') app.checkFillAnswer(this.value)">
            <button class="audio-btn" onclick="app.playAudio('${this.currentWord.word}')">
              🔊
            </button>
          </div>
          <div class="word-pronunciation">${pronunciation}</div>
          <div class="meaning-hint">
            <span class="part-of-speech">${firstMeaning.partOfSpeech}</span>
            <p class="definition">${firstMeaning.definition}</p>
          </div>
          <div class="fill-controls">
            <button class="check-btn" onclick="app.checkFillAnswer(document.getElementById('wordInput').value)">检查答案</button>
            <button class="reveal-btn" onclick="app.revealFillAnswer()">显示答案</button>
          </div>
          <div class="answer-result"></div>
        </div>
      </div>
    `;
    
    // 设置输入框焦点
    setTimeout(() => {
      const input = document.getElementById('wordInput');
      if (input) input.focus();
    }, 100);
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
  
  // 在VocabularyApp类中添加缺失的方法
  
  // 基于频次的单词选择算法
  selectWordByFrequency(words) {
    // 根据难度和复习次数计算权重
    const weightedWords = words.map(word => ({
      ...word,
      weight: (word.difficulty + 1) * (1 / (word.reviewCount + 1))
    }));
    
    // 按权重排序，选择权重最高的
    weightedWords.sort((a, b) => b.weight - a.weight);
    return weightedWords[0];
  }
  
  // 检查填空答案
  checkFillAnswer(answer) {
    const resultDiv = document.querySelector('.answer-result') || this.createAnswerResultDiv();
    
    if (answer.toLowerCase().trim() === this.currentWord.word.toLowerCase()) {
      resultDiv.innerHTML = `
        <div class="correct-answer">
          <span class="result-icon">✅</span>
          <span class="result-text">正确！单词是: <strong>${this.currentWord.word}</strong></span>
        </div>
      `;
      setTimeout(() => this.markWord('know'), 2000);
    } else {
      resultDiv.innerHTML = `
        <div class="wrong-answer">
          <span class="result-icon">❌</span>
          <span class="result-text">不正确，再试试看！</span>
        </div>
      `;
    }
  }
  
  // 显示答案
  revealFillAnswer() {
    const input = document.querySelector('.fill-input');
    const resultDiv = document.querySelector('.answer-result') || this.createAnswerResultDiv();
    
    if (input) input.value = this.currentWord.word;
    resultDiv.innerHTML = `
      <div class="revealed-answer">
        <span class="result-icon">💡</span>
        <span class="result-text">答案是: <strong>${this.currentWord.word}</strong></span>
      </div>
    `;
    
    setTimeout(() => this.markWord('unknown'), 3000);
  }
  
  // 创建答案结果显示区域
  createAnswerResultDiv() {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'answer-result';
    document.querySelector('.word-card').appendChild(resultDiv);
    return resultDiv;
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