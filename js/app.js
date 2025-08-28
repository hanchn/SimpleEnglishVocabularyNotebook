class VocabularyApp {
    constructor() {
        this.wordHistory = [];
        this.currentIndex = -1;
        this.isLoading = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateNavigationButtons();
    }

    bindEvents() {
        // 模式切换
        const modeToggle = document.getElementById('modeToggle');
        modeToggle.addEventListener('change', (e) => {
            const mode = e.target.checked ? 'online' : 'local';
            window.apiManager.setMode(mode);
            this.updateImageVisibility(mode);
        });

        // 开始学习按钮
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startLearning();
        });

        // 导航按钮
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.showPreviousWord();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.showNextWord();
        });

        // 发音按钮
        document.getElementById('pronounceBtn').addEventListener('click', () => {
            this.pronounceWord();
        });
    }

    // 更新图片显示状态
    updateImageVisibility(mode) {
        const imageContainer = document.getElementById('wordImageContainer');
        if (mode === 'local') {
            imageContainer.style.display = 'none';
        } else {
            imageContainer.style.display = 'block';
        }
    }

    // 开始学习
    async startLearning() {
        document.getElementById('startContainer').style.display = 'none';
        document.getElementById('controls').style.display = 'block';
        
        await this.loadNextWord();
    }

    // 加载下一个单词
    async loadNextWord() {
        if (this.isLoading) return;
        
        this.showLoading(true);
        
        try {
            const wordData = await window.apiManager.getRandomWord();
            this.addWordToHistory(wordData);
            this.displayWord(wordData);
            this.updateNavigationButtons();
        } catch (error) {
            this.showError(`加载单词失败: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    // 显示上一个单词
    showPreviousWord() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            const wordData = this.wordHistory[this.currentIndex];
            this.displayWord(wordData);
            this.updateNavigationButtons();
        }
    }

    // 显示下一个单词
    async showNextWord() {
        if (this.currentIndex < this.wordHistory.length - 1) {
            this.currentIndex++;
            const wordData = this.wordHistory[this.currentIndex];
            this.displayWord(wordData);
            this.updateNavigationButtons();
        } else {
            await this.loadNextWord();
        }
    }

    // 添加单词到历史记录
    addWordToHistory(wordData) {
        this.wordHistory.push(wordData);
        this.currentIndex = this.wordHistory.length - 1;
    }

    // 显示单词
    displayWord(wordData) {
        document.getElementById('wordText').textContent = wordData.word;
        document.getElementById('wordPhonetic').textContent = wordData.phonetic || '暂无音标';
        
        if (wordData.meanings && wordData.meanings.length > 0) {
            const meaning = wordData.meanings[0];
            document.getElementById('partOfSpeech').textContent = meaning.partOfSpeech;
            document.getElementById('definition').textContent = meaning.definition;
            document.getElementById('exampleSentence').textContent = meaning.example || '暂无例句';
        }
        
        // 处理图片显示
        const imageContainer = document.getElementById('wordImageContainer');
        const wordImage = document.getElementById('wordImage');
        
        if (wordData.imageUrl && window.apiManager.getMode() === 'online') {
            wordImage.src = wordData.imageUrl;
            wordImage.alt = `${wordData.word} 的图片`;
            imageContainer.style.display = 'block';
        } else {
            imageContainer.style.display = 'none';
        }
        
        document.getElementById('wordCard').style.display = 'block';
    }

    // 更新导航按钮状态
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        prevBtn.disabled = this.currentIndex <= 0;
        nextBtn.disabled = false; // 下一个按钮始终可用
    }

    // 发音功能
    pronounceWord() {
        const word = document.getElementById('wordText').textContent;
        if (word && window.audioManager) {
            window.audioManager.speak(word);
        }
    }

    // 显示加载状态
    showLoading(show) {
        this.isLoading = show;
        document.getElementById('loading').style.display = show ? 'block' : 'none';
        document.getElementById('wordCard').style.display = show ? 'none' : 'block';
    }

    // 显示错误信息
    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.vocabularyApp = new VocabularyApp();
});