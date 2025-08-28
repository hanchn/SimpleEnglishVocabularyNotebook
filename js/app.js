// 主应用类
class VocabularyApp {
  constructor() {
    this.currentMode = 'quick';
    this.currentWord = null;
    this.storage = new StorageManager();
    this.api = new APIManager();
    this.audio = new AudioManager();
    
    // 单词历史记录管理
    this.wordHistory = [];
    this.currentWordIndex = -1;
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.loadStats();
  }
  
  // 事件绑定
  bindEvents() {
    // 模式切换
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchMode(e.target.dataset.mode);
      });
    });
    
    // 开始学习按钮
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.hideWelcomeMessage();
        this.showControls();
        this.startLearning();
      });
    }
    
    // 导航按钮
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.navigateToPrevious());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateToNext());
    }
    
    // 填空模式按钮
    const checkAnswerBtn = document.getElementById('checkAnswerBtn');
    const revealAnswerBtn = document.getElementById('revealAnswerBtn');
    if (checkAnswerBtn) {
      checkAnswerBtn.addEventListener('click', () => this.checkFillAnswer());
    }
    if (revealAnswerBtn) {
      revealAnswerBtn.addEventListener('click', () => this.revealFillAnswer());
    }
    
    // 发音按钮
    const playWordBtn = document.getElementById('playWordBtn');
    const playExampleWordBtn = document.getElementById('playExampleWordBtn');
    if (playWordBtn) {
      playWordBtn.addEventListener('click', () => this.playCurrentWord());
    }
    if (playExampleWordBtn) {
      playExampleWordBtn.addEventListener('click', () => this.playCurrentWord());
    }
    
    // 重试按钮
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) retryBtn.addEventListener('click', () => this.startLearning());
  }
  
  hideWelcomeMessage() {
    const welcome = document.getElementById('welcomeMessage');
    if (welcome) welcome.style.display = 'none';
  }
  
  showControls() {
    const controls = document.getElementById('controls');
    if (controls) controls.style.display = 'block';
  }
  
  showLoading() {
    this.hideAllCards();
    const loading = document.getElementById('loadingMessage');
    if (loading) loading.style.display = 'block';
  }
  
  hideAllCards() {
    const cards = ['quickModeCard', 'fillModeCard', 'exampleModeCard', 'errorMessage', 'loadingMessage'];
    cards.forEach(cardId => {
      const card = document.getElementById(cardId);
      if (card) card.style.display = 'none';
    });
  }
  
  showError(message) {
    this.hideAllCards();
    const errorMsg = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    if (errorMsg) errorMsg.style.display = 'block';
    if (errorText) errorText.textContent = message;
  }
  
  // 开始学习
  async startLearning() {
    try {
      await this.loadNextWord();
    } catch (error) {
      console.error('开始学习失败:', error);
      this.showError('开始学习失败，请重试');
    }
  }
  
  // 切换模式
  switchMode(mode) {
    this.currentMode = mode;
    this.updateModeUI();
    
    // 如果有当前单词，重新显示
    if (this.currentWord) {
      this.displayWord();
    }
  }
  
  // 更新模式UI
  updateModeUI() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.mode === this.currentMode) {
        btn.classList.add('active');
      }
    });
  }
  
  // 加载下一个单词
  async loadNextWord() {
    this.showLoading();
    try {
      const word = await this.getNextWord();
      this.currentWord = word;
      this.addWordToHistory(word);
      this.displayWord();
    } catch (error) {
      console.error('加载单词失败:', error);
      this.showError('加载单词失败，请检查网络连接');
    }
  }
  
  // 获取下一个单词
  async getNextWord() {
    return await this.api.getRandomWord();
  }
  
  // 显示单词
  displayWord() {
    if (!this.currentWord) return;
    
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
  
  // 添加单词到历史记录
  addWordToHistory(word) {
    // 如果不是通过导航到达的单词，添加到历史记录
    if (this.currentWordIndex === this.wordHistory.length - 1 || this.currentWordIndex === -1) {
      this.wordHistory.push(word);
      this.currentWordIndex = this.wordHistory.length - 1;
      
      // 限制历史记录长度
      if (this.wordHistory.length > 50) {
        this.wordHistory.shift();
        this.currentWordIndex--;
      }
    }
    
    this.updateNavigationUI();
  }
  
  // 导航到上一个单词
  navigateToPrevious() {
    if (this.currentWordIndex > 0) {
      this.currentWordIndex--;
      this.currentWord = this.wordHistory[this.currentWordIndex];
      this.displayWord();
      this.updateNavigationUI();
    }
  }
  
  // 导航到下一个单词
  navigateToNext() {
    if (this.currentWordIndex < this.wordHistory.length - 1) {
      this.currentWordIndex++;
      this.currentWord = this.wordHistory[this.currentWordIndex];
      this.displayWord();
      this.updateNavigationUI();
    } else {
      // 如果已经是最后一个单词，加载新单词
      this.loadNextWord();
    }
  }
  
  // 更新导航UI
  updateNavigationUI() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const counter = document.getElementById('wordCounter');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentWordIndex <= 0;
    }
    
    if (nextBtn) {
      // 下一个按钮总是可用（可以加载新单词）
      nextBtn.disabled = false;
    }
    
    if (counter) {
      counter.textContent = `${this.currentWordIndex + 1}/${this.wordHistory.length}`;
    }
  }
  
  // 快速模式显示
  displayQuickMode() {
    this.hideAllCards();
    const card = document.getElementById('quickModeCard');
    if (card) card.style.display = 'block';
    
    const meaning = this.currentWord.meanings[0] || {
      partOfSpeech: 'unknown',
      definitions: [{ definition: '暂无释义' }]
    };
    
    const definition = meaning.definitions[0]?.definition || '暂无释义';
    const example = meaning.definitions[0]?.example || '';
    
    // 更新内容
    this.updateElement('wordText', this.currentWord.word);
    this.updateElement('wordPronunciation', this.currentWord.phonetic || '');
    this.updateElement('partOfSpeech', meaning.partOfSpeech);
    this.updateElement('definition', definition);
    
    // 处理例句
    const exampleDiv = document.getElementById('wordExample');
    const exampleText = document.getElementById('exampleText');
    if (example && exampleDiv && exampleText) {
      exampleText.textContent = example;
      exampleDiv.style.display = 'block';
    } else if (exampleDiv) {
      exampleDiv.style.display = 'none';
    }
  }
  
  // 填空模式显示
  displayFillMode() {
    this.hideAllCards();
    const card = document.getElementById('fillModeCard');
    if (card) card.style.display = 'block';
    
    const meaning = this.currentWord.meanings[0] || {
      partOfSpeech: 'unknown',
      definitions: [{ definition: '暂无释义' }]
    };
    
    const definition = meaning.definitions[0]?.definition || '暂无释义';
    const blankedWord = this.createBlankedWord(this.currentWord.word);
    
    // 更新内容
    this.updateElement('fillBlank', blankedWord);
    this.updateElement('fillPartOfSpeech', meaning.partOfSpeech);
    this.updateElement('fillDefinition', definition);
    
    // 清空输入框和结果
    const input = document.getElementById('fillInput');
    const result = document.getElementById('fillResult');
    if (input) input.value = '';
    if (result) result.innerHTML = '';
    
    // 聚焦输入框
    setTimeout(() => {
      if (input) input.focus();
    }, 100);
  }
  
  // 例句模式显示
  displayExampleMode() {
    this.hideAllCards();
    const card = document.getElementById('exampleModeCard');
    if (card) card.style.display = 'block';
    
    const meaning = this.currentWord.meanings[0] || {
      partOfSpeech: 'unknown',
      definitions: [{ definition: '暂无释义' }]
    };
    
    const definition = meaning.definitions[0]?.definition || '暂无释义';
    const example = meaning.definitions[0]?.example || '暂无例句';
    
    // 更新内容
    this.updateElement('exampleWordText', this.currentWord.word);
    this.updateElement('exampleWordPronunciation', this.currentWord.phonetic || '');
    this.updateElement('examplePartOfSpeech', meaning.partOfSpeech);
    this.updateElement('exampleDefinition', definition);
    this.updateElement('exampleSentence', example);
  }
  
  // 创建填空单词
  createBlankedWord(word) {
    return word.split('').map(() => '_').join(' ');
  }
  
  // 检查填空答案
  checkFillAnswer() {
    const input = document.getElementById('fillInput');
    const result = document.getElementById('fillResult');
    
    if (!input || !result) return;
    
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = this.currentWord.word.toLowerCase();
    
    if (userAnswer === correctAnswer) {
      result.innerHTML = '<span style="color: green;">✓ 正确！</span>';
    } else {
      result.innerHTML = `<span style="color: red;">✗ 错误。正确答案是: ${this.currentWord.word}</span>`;
    }
  }
  
  // 显示填空答案
  revealFillAnswer() {
    const result = document.getElementById('fillResult');
    if (result) {
      result.innerHTML = `<span style="color: blue;">答案: ${this.currentWord.word}</span>`;
    }
  }
  
  // 播放当前单词发音
  playCurrentWord() {
    if (this.currentWord && this.currentWord.word) {
      this.audio.playWord(this.currentWord.word);
    }
  }
  
  // 播放当前例句发音
  playCurrentSentence() {
    const meaning = this.currentWord?.meanings[0];
    const example = meaning?.definitions[0]?.example;
    if (example) {
      this.audio.playSentence(example);
    }
  }
  
  // 加载统计数据
  loadStats() {
    // 可以在这里加载学习统计
  }
  
  // 更新统计数据
  updateStats() {
    // 可以在这里更新学习统计
  }
  
  // 辅助方法：更新元素内容
  updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) element.textContent = content;
  }
}

// 初始化应用
const app = new VocabularyApp();