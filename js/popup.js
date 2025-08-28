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

  // 更新事件绑定，移除设置和统计按钮的事件
  bindEvents() {
    // 模式切换
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchMode(e.target.dataset.mode);
      });
    });
  
    // 开始学习
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.startLearning();
      });
    }
  
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

  // 更新开始学习方法
  async startLearning() {
    try {
      const welcomeMessage = document.querySelector('.welcome-message');
      const controls = document.getElementById('controls');
      
      if (welcomeMessage) welcomeMessage.style.display = 'none';
      if (controls) controls.style.display = 'flex';
      
      await this.nextWord();
    } catch (error) {
      this.showError('开始学习失败，请重试');
    }
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

  // 在displayWord方法中添加图片支持
  async displayWord() {
    if (!this.currentWord) {
      this.showError('没有可显示的单词');
      return;
    }
  
    // 获取单词图片
    const image = await this.api.getWordImage(this.currentWord.word);
    this.currentWordImage = image;
  
    const wordArea = document.getElementById('wordArea');
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
        // 填空练习模式：显示定义，用户输入单词
        const firstMeaning = this.currentWord.meanings[0];
        wordHtml = `
          <div class="word-card">
            <div class="fill-exercise">
              <h3>🖊️ 填空练习</h3>
              <div class="word-input-area">
                <input type="text" 
                       id="wordInput" 
                       class="word-input" 
                       placeholder="请输入单词..."
                       autocomplete="off"
                       spellcheck="false">
                <button class="audio-btn" onclick="app.playAudio()">
                  🔊
                </button>
              </div>
              <div class="word-pronunciation">${this.currentWord.pronunciation}</div>
              <div class="meaning-hint">
                <span class="part-of-speech">${firstMeaning.partOfSpeech}</span>
                <p class="definition">${firstMeaning.definition}</p>
              </div>
              <div class="fill-controls">
                <button class="check-btn" onclick="app.checkAnswer()">检查答案</button>
                <button class="reveal-btn" onclick="app.revealAnswer()">显示答案</button>
              </div>
              <div id="answerResult" class="answer-result"></div>
            </div>
          </div>
        `;
        // 设置输入框焦点
        setTimeout(() => {
          const input = document.getElementById('wordInput');
          if (input) {
            input.focus();
            // 添加回车键检查答案
            input.addEventListener('keypress', (e) => {
              if (e.key === 'Enter') {
                this.checkAnswer();
              }
            });
          }
        }, 100);
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
  
  // 检查填空答案
  checkAnswer() {
    const input = document.getElementById('wordInput');
    const resultDiv = document.getElementById('answerResult');
    
    if (!input || !resultDiv || !this.currentWord) return;
    
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = this.currentWord.word.toLowerCase();
    
    if (userAnswer === correctAnswer) {
      resultDiv.innerHTML = `
        <div class="correct-answer">
          <span class="result-icon">✅</span>
          <span class="result-text">正确！单词是: <strong>${this.currentWord.word}</strong></span>
        </div>
      `;
      // 自动进入下一个单词
      setTimeout(() => {
        this.markWord(true);
      }, 2000);
    } else {
      resultDiv.innerHTML = `
        <div class="wrong-answer">
          <span class="result-icon">❌</span>
          <span class="result-text">不正确，再试试看！</span>
        </div>
      `;
      // 清空输入框让用户重试
      input.value = '';
      input.focus();
    }
  }
  
  // 显示答案
  revealAnswer() {
    const input = document.getElementById('wordInput');
    const resultDiv = document.getElementById('answerResult');
    
    if (!input || !resultDiv || !this.currentWord) return;
    
    input.value = this.currentWord.word;
    resultDiv.innerHTML = `
      <div class="revealed-answer">
        <span class="result-icon">💡</span>
        <span class="result-text">答案是: <strong>${this.currentWord.word}</strong></span>
      </div>
    `;
    
    // 3秒后自动进入下一个单词
    setTimeout(() => {
      this.markWord(false); // 标记为不认识
    }, 3000);
  }
}

const app = new VocabularyExtension();

// 将displayQuickMode移到类内部
displayQuickMode() {
  const imageHtml = this.currentWordImage ? 
    `<div class="word-image">
      <img src="${this.currentWordImage.url}" alt="${this.currentWordImage.alt}" 
           onerror="this.src='${this.currentWordImage.fallback || this.currentWordImage.url}'" 
           style="max-width: 280px; max-height: 150px; border-radius: 6px; margin: 8px 0;">
    </div>` : '';

  const meaning = this.currentWord.meanings && this.currentWord.meanings[0] ? 
    this.currentWord.meanings[0] : { partOfSpeech: '未知', definition: '暂无释义' };

  return `
    <div class="word-display">
      <div class="word-text">${this.currentWord.word}</div>
      <div class="word-pronunciation">
        ${this.currentWord.pronunciation || '[暂无音标]'}
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