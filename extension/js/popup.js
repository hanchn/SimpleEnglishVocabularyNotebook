class VocabularyExtension {
  constructor() {
    this.storage = new ChromeStorageManager();
    this.api = new ChromeAPIManager();
    this.audio = new ChromeAudioManager();
    this.currentWord = null;
    this.currentMode = 'quick';
    this.init();
  }

  async init() {
    await this.storage.initializeStats();
    await this.loadStats();
    this.bindEvents();
  }

  bindEvents() {
    // 模式切换
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchMode(e.target.dataset.mode);
      });
    });

    // 开始学习
    document.getElementById('startBtn').addEventListener('click', () => {
      this.startLearning();
    });

    // 控制按钮
    document.getElementById('knowBtn').addEventListener('click', () => {
      this.markWord(true);
    });
    
    document.getElementById('unknownBtn').addEventListener('click', () => {
      this.markWord(false);
    });
    
    document.getElementById('passBtn').addEventListener('click', () => {
      this.nextWord();
    });
  }

  async loadStats() {
    const stats = await this.storage.getStats();
    if (stats) {
      document.getElementById('totalWords').textContent = stats.totalWords || 0;
      document.getElementById('streakDays').textContent = stats.streakDays || 0;
    }
  }

  switchMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    // 重新显示当前单词以应用新模式
    if (this.currentWord) {
      this.displayWord();
    }
  }

  displayWord() {
    const learningArea = document.getElementById('learningArea');
    if (!this.currentWord) return;

    let wordHtml = '';
    
    switch (this.currentMode) {
      case 'quick':
        // 快速背诵模式：只显示单词和音标
        wordHtml = `
          <div class="word-card">
            <div class="word-header">
              <h2 class="word-text">${this.currentWord.word}</h2>
              <button class="audio-btn" onclick="app.playAudio()">
                🔊
              </button>
            </div>
            <div class="word-pronunciation">${this.currentWord.pronunciation}</div>
            <div class="quick-hint">
              <p>💡 想想这个单词的意思，然后点击下方按钮</p>
            </div>
          </div>
        `;
        break;
        
      case 'fill':
        // 填空练习模式：显示定义，隐藏单词
        const firstMeaning = this.currentWord.meanings[0];
        wordHtml = `
          <div class="word-card">
            <div class="fill-exercise">
              <h3>填空练习</h3>
              <div class="word-blank">
                <span class="blank-line">_ _ _ _ _ _</span>
                <button class="audio-btn" onclick="app.playAudio()">
                  🔊
                </button>
              </div>
              <div class="word-pronunciation">${this.currentWord.pronunciation}</div>
              <div class="meaning-hint">
                <span class="part-of-speech">${firstMeaning.partOfSpeech}</span>
                <p class="definition">${firstMeaning.definition}</p>
              </div>
            </div>
          </div>
        `;
        break;
        
      case 'example':
        // 例句学习模式：显示完整信息
        wordHtml = `
          <div class="word-card">
            <div class="word-header">
              <h2 class="word-text">${this.currentWord.word}</h2>
              <button class="audio-btn" onclick="app.playAudio()">
                🔊
              </button>
            </div>
            <div class="word-pronunciation">${this.currentWord.pronunciation}</div>
            <div class="word-meanings">
              ${this.currentWord.meanings.map(m => `
                <div class="meaning-item">
                  <span class="part-of-speech">${m.partOfSpeech}</span>
                  <p class="definition">${m.definition}</p>
                  ${m.example ? `<p class="example">📝 例句: ${m.example}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `;
        break;
        
      default:
        // 默认显示快速模式
        this.currentMode = 'quick';
        this.displayWord();
        return;
    }
    
    learningArea.innerHTML = wordHtml;
  }

  async startLearning() {
    try {
      document.querySelector('.welcome-message').style.display = 'none';
      document.getElementById('controls').style.display = 'flex';
      await this.nextWord();
    } catch (error) {
      this.showError('开始学习失败，请重试');
    }
  }

  async nextWord() {
    try {
      this.showLoading();
      this.currentWord = await this.api.getRandomWord();
      this.displayWord();
    } catch (error) {
      this.showError('获取单词失败，请检查网络连接');
    }
  }

  playAudio() {
    if (this.currentWord) {
      this.audio.speakWord(this.currentWord.word);
    }
  }

  async markWord(known) {
    if (!this.currentWord) return;
    
    this.currentWord.reviewCount++;
    if (known) {
      this.currentWord.passCount++;
    }
    
    await this.storage.saveWord(this.currentWord);
    await this.updateStats(known);
    await this.nextWord();
  }

  async updateStats(correct) {
    const stats = await this.storage.getStats() || {};
    stats.totalReviews = (stats.totalReviews || 0) + 1;
    if (correct) {
      stats.correctAnswers = (stats.correctAnswers || 0) + 1;
    }
    stats.accuracy = Math.round((stats.correctAnswers / stats.totalReviews) * 100);
    
    await this.storage.updateStats(stats);
    await this.loadStats();
  }

  showLoading() {
    document.getElementById('learningArea').innerHTML = '<div class="loading">加载中...</div>';
  }

  // 在VocabularyExtension类中改进showError方法
  showError(message) {
    document.getElementById('learningArea').innerHTML = `
      <div class="error-message">
        <p>⚠️ ${message}</p>
        <div class="error-actions">
          <button class="retry-btn" onclick="app.nextWord()">重试</button>
          <button class="offline-btn" onclick="app.useOfflineMode()">离线模式</button>
        </div>
      </div>
    `;
  }
  
  // 添加离线模式
  useOfflineMode() {
    this.currentWord = {
      id: Date.now().toString(),
      word: 'example',
      pronunciation: '/ɪɡˈzæmpəl/',
      meanings: [{
        partOfSpeech: 'noun',
        definition: 'a thing characteristic of its kind or illustrating a general rule',
        example: 'This is an example sentence.'
      }],
      difficulty: 0,
      frequency: 1.0,
      addedDate: new Date().toISOString(),
      reviewCount: 0,
      passCount: 0
    };
    this.displayWord();
  }
}

// 初始化应用
const app = new VocabularyExtension();