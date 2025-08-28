class VocabularyApp {
    constructor() {
        this.currentIndex = -1;
        this.wordHistory = [];
        this.isLoading = false;
        this.tooltip = null;
    }

    init() {
        this.bindEvents();
        this.updateImageVisibility(window.apiManager.getMode());
        this.initTooltip();
    }

    // 初始化气泡功能
    initTooltip() {
        this.tooltip = document.getElementById('tooltip');
        const wordText = document.getElementById('wordText');
        
        if (wordText && this.tooltip) {
            wordText.addEventListener('mouseenter', (e) => this.showTooltip(e));
            wordText.addEventListener('mouseleave', () => this.hideTooltip());
            wordText.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
        }
    }

    // 显示气泡
    showTooltip(event) {
        const wordData = this.getCurrentWordData();
        if (!wordData || !wordData.chinese) {
            return;
        }

        const tooltipContent = this.tooltip.querySelector('.tooltip-content');
        tooltipContent.textContent = wordData.chinese;
        
        this.updateTooltipPosition(event);
        this.tooltip.style.display = 'block';
        
        // 使用setTimeout确保display设置后再添加show类
        setTimeout(() => {
            this.tooltip.classList.add('show');
        }, 10);
    }

    // 隐藏气泡
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.remove('show');
            setTimeout(() => {
                this.tooltip.style.display = 'none';
            }, 300);
        }
    }

    // 更新气泡位置
    updateTooltipPosition(event) {
        if (!this.tooltip) return;
        
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 10;
        
        // 确保气泡不超出屏幕边界
        const padding = 10;
        if (left < padding) {
            left = padding;
        } else if (left + tooltipRect.width > window.innerWidth - padding) {
            left = window.innerWidth - tooltipRect.width - padding;
        }
        
        if (top < padding) {
            top = rect.bottom + 10;
            // 调整箭头方向
            this.tooltip.classList.add('tooltip-bottom');
        } else {
            this.tooltip.classList.remove('tooltip-bottom');
        }
        
        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    }

    // 获取当前单词数据
    getCurrentWordData() {
        if (this.currentIndex >= 0 && this.currentIndex < this.wordHistory.length) {
            return this.wordHistory[this.currentIndex];
        }
        return null;
    }

    bindEvents() {
        // 模式切换
        const modeToggle = document.getElementById('modeToggle');
        if (modeToggle) {
            modeToggle.addEventListener('change', (e) => {
                const mode = e.target.checked ? 'online' : 'local';
                window.apiManager.setMode(mode);
                this.updateImageVisibility(mode);
            });
        }

        // 开始学习按钮
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startLearning();
        });

        // 发音按钮
        document.getElementById('pronounceBtn').addEventListener('click', () => {
            this.pronounceWord();
        });

        // 导航按钮
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.showPreviousWord();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.showNextWord();
        });
    }

    // 更新图片显示状态
    updateImageVisibility(mode) {
        const imageContainer = document.getElementById('wordImageContainer');
        if (imageContainer) {
            imageContainer.style.display = mode === 'local' ? 'none' : 'block';
        }
    }

    // 开始学习
    async startLearning() {
        await window.apiManager.loadLocalWords();
        await this.loadNextWord();
        document.getElementById('startContainer').style.display = 'none';
        document.getElementById('controls').style.display = 'block';
    }

    // 加载下一个单词
    async loadNextWord() {
        try {
            this.showLoading(true);
            const wordData = await window.apiManager.getRandomWord();
            this.addWordToHistory(wordData);
            this.displayWord(wordData);
            this.updateNavigationButtons();
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // 显示上一个单词
    showPreviousWord() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayWord(this.wordHistory[this.currentIndex]);
            this.updateNavigationButtons();
        }
    }

    // 显示下一个单词
    async showNextWord() {
        if (this.currentIndex < this.wordHistory.length - 1) {
            this.currentIndex++;
            this.displayWord(this.wordHistory[this.currentIndex]);
        } else {
            await this.loadNextWord();
        }
        this.updateNavigationButtons();
    }

    // 添加单词到历史记录
    addWordToHistory(wordData) {
        this.wordHistory.push(wordData);
        this.currentIndex = this.wordHistory.length - 1;
    }

    // 显示单词
    displayWord(wordData) {
        const wordElement = document.getElementById('wordText');
        wordElement.textContent = wordData.word;
        // 添加中文翻译作为title属性
        if (wordData.chinese) {
            wordElement.title = wordData.chinese;
        }
        
        document.getElementById('wordPhonetic').textContent = wordData.phonetic || '暂无音标';
        
        if (wordData.meanings && wordData.meanings.length > 0) {
            const meaning = wordData.meanings[0];
            document.getElementById('partOfSpeech').textContent = meaning.partOfSpeech;
            document.getElementById('definition').textContent = meaning.definition;
            
            // 例句处理：只有存在例句时才显示，否则隐藏例句区域
            const exampleContainer = document.querySelector('.word-example');
            const exampleSentence = document.getElementById('exampleSentence');
            
            if (meaning.example && meaning.example.trim()) {
                exampleSentence.textContent = meaning.example;
                exampleContainer.style.display = 'block';
            } else {
                exampleContainer.style.display = 'none';
            }
        }
        
        // 处理图片显示
        this.handleImageDisplay(wordData);
        
        document.getElementById('wordCard').style.display = 'block';
    }

    // 处理图片显示逻辑
    handleImageDisplay(wordData) {
        const imageContainer = document.getElementById('wordImageContainer');
        const wordImage = document.getElementById('wordImage');
        
        // 本地模式或没有图片URL时隐藏图片
        if (window.apiManager.getMode() === 'local' || !wordData.imageUrl) {
            imageContainer.style.display = 'none';
            return;
        }
        
        // 在线模式且有图片URL时尝试加载图片
        if (wordData.imageUrl) {
            // 先隐藏图片容器，加载成功后再显示
            imageContainer.style.display = 'none';
            
            wordImage.onload = () => {
                console.log('图片加载成功');
                imageContainer.style.display = 'block';
            };
            
            wordImage.onerror = () => {
                console.log('图片加载失败，保持隐藏状态');
                imageContainer.style.display = 'none';
            };
            
            wordImage.src = wordData.imageUrl;
            wordImage.alt = `${wordData.word} 的图片`;
        }
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
        } else {
            // 如果没有audioManager，使用浏览器内置的语音合成
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(word);
                utterance.lang = 'en-US';
                speechSynthesis.speak(utterance);
            }
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
    window.vocabularyApp.init();
});