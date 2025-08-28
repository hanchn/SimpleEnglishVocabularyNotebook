class APIManager {
    constructor() {
        this.mode = 'local'; // 默认本地模式
        this.localWords = [];
        this.currentLocalIndex = 0;
        this.loadLocalWords();
    }

    // 设置模式（local 或 online）
    setMode(mode) {
        this.mode = mode;
        console.log(`切换到${mode === 'local' ? '本地' : '在线'}模式`);
    }

    // 获取当前模式
    getMode() {
        return this.mode;
    }

    // 加载本地词库
    async loadLocalWords() {
        try {
            const response = await fetch('./data/words.json');
            if (!response.ok) {
                throw new Error('无法加载本地词库');
            }
            this.localWords = await response.json();
            console.log(`本地词库加载成功，共${this.localWords.length}个单词`);
        } catch (error) {
            console.error('加载本地词库失败:', error);
            // 提供备用数据
            this.localWords = [
                {
                    id: "1",
                    word: "vocabulary",
                    pronunciation: "/vəˈkæbjʊləri/",
                    meanings: [{
                        partOfSpeech: "noun",
                        definition: "The body of words used in a particular language.",
                        example: "Reading helps expand your vocabulary."
                    }]
                }
            ];
        }
    }

    // 获取随机单词（根据模式）
    async getRandomWord() {
        if (this.mode === 'local') {
            return this.getRandomLocalWord();
        } else {
            return this.getRandomOnlineWord();
        }
    }

    // 获取本地随机单词
    getRandomLocalWord() {
        if (this.localWords.length === 0) {
            throw new Error('本地词库为空');
        }
        
        const randomIndex = Math.floor(Math.random() * this.localWords.length);
        const word = this.localWords[randomIndex];
        
        return {
            word: word.word,
            phonetic: word.pronunciation,
            meanings: word.meanings.map(meaning => ({
                partOfSpeech: meaning.partOfSpeech,
                definition: meaning.definition,
                example: meaning.example
            })),
            // 本地模式不提供图片
            imageUrl: null
        };
    }

    // 获取在线随机单词
    async getRandomOnlineWord() {
        const words = [
            'apple', 'banana', 'computer', 'education', 'freedom',
            'happiness', 'knowledge', 'language', 'mountain', 'ocean',
            'philosophy', 'question', 'rainbow', 'science', 'technology',
            'universe', 'victory', 'wisdom', 'yesterday', 'zealous'
        ];
        
        const randomWord = words[Math.floor(Math.random() * words.length)];
        return this.getWordDetails(randomWord);
    }

    // 获取单词详情（在线模式）
    async getWordDetails(word) {
        if (this.mode === 'local') {
            // 本地模式下搜索本地词库
            const localWord = this.localWords.find(w => w.word.toLowerCase() === word.toLowerCase());
            if (localWord) {
                return {
                    word: localWord.word,
                    phonetic: localWord.pronunciation,
                    meanings: localWord.meanings.map(meaning => ({
                        partOfSpeech: meaning.partOfSpeech,
                        definition: meaning.definition,
                        example: meaning.example
                    })),
                    imageUrl: null
                };
            } else {
                throw new Error('本地词库中未找到该单词');
            }
        }

        try {
            console.log(`正在获取单词: ${word}`);
            
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();
            const wordData = this.parseWordData(data, word);
            
            // 在线模式尝试获取图片，但不强制要求
            try {
                const imageUrl = await this.getWordImage(word);
                wordData.imageUrl = imageUrl;
            } catch (imageError) {
                console.log('图片获取失败，不显示图片:', imageError.message);
                wordData.imageUrl = null;
            }
            
            return wordData;
        } catch (error) {
            console.error('获取单词详情失败:', error);
            throw new Error(`无法获取单词 "${word}" 的详情: ${error.message}`);
        }
    }

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
                    meanings.push({
                        partOfSpeech: meaning.partOfSpeech || 'unknown',
                        definition: definition.definition || '暂无定义',
                        example: definition.example || '暂无例句'
                    });
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

    // 获取单词图片（仅在线模式，使用免费服务）
    async getWordImage(word) {
        if (this.mode === 'local') {
            return null;
        }

        // 使用免费的图片服务，不依赖API key
        try {
            // 尝试使用 Pixabay 的免费API（需要注册获取key）或使用占位图片服务
            const imageUrl = `https://source.unsplash.com/300x200/?${encodeURIComponent(word)}`;
            
            // 测试图片是否可以加载
            const testResponse = await fetch(imageUrl, { method: 'HEAD' });
            if (testResponse.ok) {
                return imageUrl;
            }
        } catch (error) {
            console.log('Unsplash图片获取失败:', error.message);
        }
        
        // 如果获取失败，返回null而不是占位图片
        return null;
    }
}

// 创建全局实例
window.apiManager = new APIManager();