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
        // 添加音频管理器初始化
        window.audioManager = new AudioManager();
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
    // 显示单词信息（增强版）
    displayWord(wordData) {
        if (!wordData) return;
        
        // 基本信息 - 网页中只显示英文单词
        const wordElement = document.getElementById('wordText');
        wordElement.textContent = wordData.word;
        
        // 将中文翻译存储在data属性中，供打印时使用
        if (wordData.chinese) {
            wordElement.setAttribute('data-chinese', wordData.chinese);
            wordElement.title = wordData.chinese; // 保留悬停提示
        }
        
        // 修复：将 'phonetic' 改为 'wordPhonetic'
        document.getElementById('wordPhonetic').textContent = wordData.pronunciation || '';
        
        // 显示多个词义
        this.displayMeanings(wordData.meanings);
        
        // 显示例句
        this.displayExamples(wordData.meanings);
        
        // 显示同义词反义词
        this.displayWordRelations(wordData.meanings);
        
        // 预加载音频
        this.preloadWordAudio(wordData);
        
        document.getElementById('wordCard').style.display = 'block';
    }
    
    // 显示多个词义
    displayMeanings(meanings) {
        const container = document.getElementById('wordMeanings');
        container.innerHTML = '';
        
        meanings.forEach((meaning, index) => {
            const meaningDiv = document.createElement('div');
            meaningDiv.className = 'meaning-item';
            meaningDiv.innerHTML = `
                <div class="meaning-header">
                    <span class="part-of-speech">${meaning.partOfSpeech}</span>
                </div>
                <div class="definition-en">${meaning.definition}</div>
                ${meaning.chineseDefinition ? `<div class="definition-cn">${meaning.chineseDefinition}</div>` : ''}
            `;
            container.appendChild(meaningDiv);
        });
    }
    
    // 显示例句
    displayExamples(meanings) {
        const container = document.getElementById('examplesList');
        const examplesContainer = document.getElementById('wordExamples');
        container.innerHTML = '';
        
        let hasExamples = false;
        
        meanings.forEach(meaning => {
            if (meaning.examples && meaning.examples.length > 0) {
                hasExamples = true;
                meaning.examples.forEach((example, index) => {
                    const exampleDiv = document.createElement('div');
                    exampleDiv.className = 'example-item';
                    exampleDiv.innerHTML = `
                        <div class="example-en">
                            <span class="example-text">${example.english}</span>
                            <button class="audio-btn" onclick="window.vocabularyApp.playExampleAudio('${example.audioFile}', '${example.english}')">
                                🔊
                            </button>
                        </div>
                        <div class="example-cn">${example.chinese}</div>
                    `;
                    container.appendChild(exampleDiv);
                });
            }
        });
        
        examplesContainer.style.display = hasExamples ? 'block' : 'none';
    }
    
    // 显示同义词反义词
    displayWordRelations(meanings) {
        const container = document.getElementById('wordRelations');
        const synonymsDiv = document.getElementById('synonyms');
        const antonymsDiv = document.getElementById('antonyms');
        
        let allSynonyms = [];
        let allAntonyms = [];
        
        meanings.forEach(meaning => {
            if (meaning.synonyms) allSynonyms.push(...meaning.synonyms);
            if (meaning.antonyms) allAntonyms.push(...meaning.antonyms);
        });
        
        // 去重
        allSynonyms = [...new Set(allSynonyms)];
        allAntonyms = [...new Set(allAntonyms)];
        
        if (allSynonyms.length > 0) {
            synonymsDiv.innerHTML = `<strong>同义词:</strong> ${allSynonyms.join(', ')}`;
        } else {
            synonymsDiv.innerHTML = '';
        }
        
        if (allAntonyms.length > 0) {
            antonymsDiv.innerHTML = `<strong>反义词:</strong> ${allAntonyms.join(', ')}`;
        } else {
            antonymsDiv.innerHTML = '';
        }
        
        container.style.display = (allSynonyms.length > 0 || allAntonyms.length > 0) ? 'block' : 'none';
    }
    
    // 预加载单词相关音频
    preloadWordAudio(wordData) {
        const audioFiles = [];
        
        if (wordData.audioFile) {
            audioFiles.push(wordData.audioFile);
        }
        
        wordData.meanings.forEach(meaning => {
            if (meaning.examples) {
                meaning.examples.forEach(example => {
                    if (example.audioFile) {
                        audioFiles.push(example.audioFile);
                    }
                });
            }
        });
        
        if (window.audioManager && audioFiles.length > 0) {
            window.audioManager.preloadAudio(audioFiles);
        }
    }
    
    // 播放单词发音（增强版）
    async pronounceWord() {
        const wordData = this.getCurrentWordData();
        if (wordData && window.audioManager) {
            await window.audioManager.speakWord(wordData.word, wordData.audioFile);
        }
    }
    
    // 播放例句音频
    async playExampleAudio(audioFile, sentence) {
        if (window.audioManager) {
            await window.audioManager.speakSentence(sentence, audioFile);
        }
    }

    // 导出图片功能 - 直接导出wordCard
    async exportAsImage() {
        try {
            const wordCard = document.getElementById('wordCard');
            const controls = document.getElementById('controls');
            const modeSwitch = document.querySelector('.mode-switch-container');
            const tooltip = document.getElementById('tooltip');
            
            if (!wordCard) {
                alert('没有找到单词卡片');
                return;
            }

            // 检查html2canvas是否加载
            if (typeof html2canvas === 'undefined') {
                alert('图片导出库未加载，请刷新页面重试');
                return;
            }

            // 临时隐藏不需要的元素
            const elementsToHide = [controls, modeSwitch, tooltip];
            const originalStyles = [];
            
            elementsToHide.forEach((element, index) => {
                if (element) {
                    originalStyles[index] = element.style.display;
                    element.style.display = 'none';
                }
            });
            
            // 临时隐藏音频按钮
            const audioButtons = wordCard.querySelectorAll('.audio-btn');
            const audioButtonStyles = [];
            audioButtons.forEach((btn, index) => {
                audioButtonStyles[index] = btn.style.display;
                btn.style.display = 'none';
            });

            // 等待DOM更新
            await new Promise(resolve => setTimeout(resolve, 100));

            // 直接对wordCard进行截图
            const canvas = await html2canvas(wordCard, {
                backgroundColor: null, // 保持透明背景，让CSS背景显示
                scale: 2, // 高质量
                useCORS: true,
                allowTaint: true,
                logging: false,
                scrollX: 0,
                scrollY: 0,
                // 确保捕获完整内容
                height: wordCard.scrollHeight,
                width: wordCard.scrollWidth,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                // 启用更好的渲染
                foreignObjectRendering: true,
                removeContainer: false,
                // 忽略特定元素
                ignoreElements: function(element) {
                    return element.classList.contains('controls') || 
                           element.classList.contains('mode-switch-container') ||
                           element.classList.contains('audio-btn') ||
                           element.id === 'tooltip';
                }
            });

            // 恢复隐藏的元素
            elementsToHide.forEach((element, index) => {
                if (element) {
                    element.style.display = originalStyles[index] || '';
                }
            });
            
            // 恢复音频按钮
            audioButtons.forEach((btn, index) => {
                btn.style.display = audioButtonStyles[index] || '';
            });

            // 创建下载链接
            const link = document.createElement('a');
            const currentWord = document.getElementById('wordText')?.textContent || 'vocabulary';
            link.download = `${currentWord}-vocabulary-card.png`;
            link.href = canvas.toDataURL('image/png', 0.95);
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('图片导出成功');
        } catch (error) {
            console.error('导出图片失败:', error);
            alert('导出图片失败，请重试');
        }
    }
    
    // 应用内联样式的辅助方法
    applyInlineStyles(element) {
        // 移除不需要的元素
        const elementsToRemove = element.querySelectorAll('.controls, .mode-switch-container, .tooltip, .audio-btn');
        elementsToRemove.forEach(el => el.remove());
        
        // 应用样式到主要元素
        const wordText = element.querySelector('.word-text');
        if (wordText) {
            wordText.style.cssText = `
                font-size: 48px;
                font-weight: bold;
                color: white;
                margin-bottom: 10px;
                text-align: center;
            `;
        }
        
        const wordPhonetic = element.querySelector('.word-phonetic');
        if (wordPhonetic) {
            wordPhonetic.style.cssText = `
                font-size: 18px;
                color: rgba(255, 255, 255, 0.8);
                text-align: center;
                margin-bottom: 30px;
            `;
        }
        
        // 词义样式
        const meaningItems = element.querySelectorAll('.meaning-item');
        meaningItems.forEach(item => {
            item.style.cssText = `
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 15px;
                color: white;
                line-height: 1.6;
            `;
            
            const partOfSpeech = item.querySelector('.part-of-speech');
            if (partOfSpeech) {
                partOfSpeech.style.cssText = `
                    color: #ffd700;
                    font-weight: bold;
                    font-size: 14px;
                    margin-bottom: 8px;
                `;
            }
            
            const definitions = item.querySelectorAll('.definition-en, .definition-cn');
            definitions.forEach(def => {
                def.style.cssText = `
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 14px;
                    margin-bottom: 5px;
                `;
            });
        });
        
        // 例句样式
        const exampleItems = element.querySelectorAll('.example-item');
        exampleItems.forEach(item => {
            item.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                color: rgba(255, 255, 255, 0.9);
                font-size: 14px;
                line-height: 1.5;
            `;
        });
        
        // 同义词反义词样式
        const synonyms = element.querySelector('.synonyms');
        const antonyms = element.querySelector('.antonyms');
        
        [synonyms, antonyms].forEach(item => {
            if (item && item.innerHTML.trim()) {
                item.style.cssText = `
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 10px;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                `;
            }
        });
        
        // 确保容器样式
        element.style.cssText = `
            background: transparent;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
    }

    // 移除 handleImageDisplay 方法
    // handleImageDisplay(wordData) { ... } - 删除整个方法

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

