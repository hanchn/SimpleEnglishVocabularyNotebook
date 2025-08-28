class APIManager {
    constructor() {
        this.mode = 'local'; // 'local' 或 'online'
        this.localWords = [];
        this.randomWords = [
            'hello', 'world', 'computer', 'programming', 'javascript',
            'python', 'learning', 'education', 'knowledge', 'skill'
        ];
    }

    setMode(mode) {
        this.mode = mode;
        console.log(`切换到${mode}模式`);
    }

    getMode() {
        return this.mode;
    }

    // 加载本地词库
    async loadLocalWords() {
        try {
            const response = await fetch('data/words.json');
            if (response.ok) {
                this.localWords = await response.json();
                console.log('本地词库加载成功:', this.localWords.length, '个单词');
            } else {
                console.error('加载本地词库失败');
                // 使用默认词库
                this.localWords = [
                    {
                        "id": "1",
                        "word": "vocabulary",
                        "pronunciation": "/vəˈkæbjʊləri/",
                        "chinese": "词汇，词汇量",
                        "meanings": [
                            {
                                "partOfSpeech": "noun",
                                "definition": "The body of words used in a particular language.",
                                "example": "Reading helps expand your vocabulary."
                            }
                        ]
                    },
                    {
                        "id": "2",
                        "word": "example",
                        "pronunciation": "/ɪɡˈzæmpəl/",
                        "chinese": "例子，示例",
                        "meanings": [
                            {
                                "partOfSpeech": "noun",
                                "definition": "A thing characteristic of its kind or illustrating a general rule.",
                                "example": "This is a good example of modern architecture."
                            }
                        ]
                    }
                ];
            }
        } catch (error) {
            console.error('加载本地词库时出错:', error);
        }
    }

    // 获取随机单词（根据模式）
    async getRandomWord() {
        if (this.mode === 'local') {
            return this.getRandomLocalWord();
        } else {
            return await this.getRandomOnlineWord();
        }
    }

    // 获取本地随机单词
    getRandomLocalWord() {
        if (this.localWords.length === 0) {
            throw new Error('本地词库为空');
        }
        const randomIndex = Math.floor(Math.random() * this.localWords.length);
        const wordData = this.localWords[randomIndex];
        return {
            word: wordData.word,
            phonetic: wordData.pronunciation,
            meanings: wordData.meanings,
            chinese: wordData.chinese
        };
    }

    // 获取在线随机单词
    async getRandomOnlineWord() {
        const randomWord = this.randomWords[Math.floor(Math.random() * this.randomWords.length)];
        return await this.getWordDetails(randomWord);
    }

    // 获取单词详情（在线模式）
    async getWordDetails(word) {
        if (this.mode === 'local') {
            // 在本地词库中查找
            const localWord = this.localWords.find(w => w.word.toLowerCase() === word.toLowerCase());
            if (localWord) {
                return {
                    word: localWord.word,
                    phonetic: localWord.pronunciation,
                    meanings: localWord.meanings,
                    chinese: localWord.chinese
                };
            } else {
                throw new Error(`本地词库中未找到单词: ${word}`);
            }
        }
    
        try {
            console.log(`获取单词详情: ${word}`);
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            const wordData = this.parseWordData(data, word);
            
            // 移除图片获取逻辑
            return wordData;
        } catch (error) {
            console.error('获取单词详情失败:', error);
            throw new Error(`无法获取单词 "${word}" 的详情: ${error.message}`);
        }
    }
    
    // 移除 getWordImage 方法
    // async getWordImage(word) { ... } - 删除整个方法
    
    // 解析单词数据
    parseWordData(data, requestedWord) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('API返回数据格式错误');
        }

        const entry = data[0];
        const word = entry.word || requestedWord;
        
        // 获取音标
        let phonetic = '';
        if (entry.phonetics && entry.phonetics.length > 0) {
            const phoneticEntry = entry.phonetics.find(p => p.text) || entry.phonetics[0];
            phonetic = phoneticEntry.text || '';
        }

        // 获取词义
        const meanings = [];
        if (entry.meanings && entry.meanings.length > 0) {
            entry.meanings.forEach(meaning => {
                if (meaning.definitions && meaning.definitions.length > 0) {
                    const definition = meaning.definitions[0];
                    const meaningObj = {
                        partOfSpeech: meaning.partOfSpeech || 'unknown',
                        definition: definition.definition || '暂无定义'
                    };
                    
                    // 只有当例句存在且不为空时才添加例句字段
                    if (definition.example && definition.example.trim()) {
                        meaningObj.example = definition.example;
                    }
                    
                    meanings.push(meaningObj);
                }
            });
        }

        if (meanings.length === 0) {
            throw new Error('未找到有效的词义信息');
        }

        return {
            word,
            phonetic,
            meanings
        };
    }
}

// 创建全局实例
window.apiManager = new APIManager();