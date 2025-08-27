// API管理
class APIManager {
  constructor() {
    this.DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
    this.WORDS_API = 'https://api.wordnik.com/v4/words.json/randomWord';
  }
  
  // 获取随机单词
  async getRandomWord() {
    try {
      const response = await fetch(`${this.WORDS_API}?api_key=demo`);
      const data = await response.json();
      return await this.getWordDetails(data.word);
    } catch (error) {
      console.error('获取随机单词失败:', error);
      return this.getFallbackWord();
    }
  }
  
  // 获取单词详情 - 改进错误处理
  async getWordDetails(word) {
    try {
      const response = await fetch(`${this.DICT_API}/${word}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data || data.length === 0) {
        throw new Error('No word data found');
      }
      return this.parseWordData(data[0]);
    } catch (error) {
      console.error('获取单词详情失败:', error);
      return this.getFallbackWord();
    }
  }
  
  // 解析单词数据 - 添加数据验证
  parseWordData(data) {
    if (!data || !data.word) {
      return this.getFallbackWord();
    }
    
    // 确保meanings数组存在且不为空
    const meanings = data.meanings && data.meanings.length > 0 
      ? data.meanings.map(m => ({
          partOfSpeech: m.partOfSpeech || 'unknown',
          definition: (m.definitions && m.definitions[0] && m.definitions[0].definition) || '暂无释义',
          example: (m.definitions && m.definitions[0] && m.definitions[0].example) || ''
        }))
      : [{
          partOfSpeech: 'unknown',
          definition: '暂无释义',
          example: ''
        }];
    
    return {
      id: Date.now().toString(),
      word: data.word,
      pronunciation: data.phonetic || data.phonetics?.[0]?.text || '',
      meanings: meanings,
      difficulty: 0,
      frequency: 1.0,
      addedDate: new Date().toISOString(),
      reviewCount: 0,
      passCount: 0
    };
  }
  
  // 备用单词数据
  getFallbackWord() {
    const fallbackWords = [
      {
        id: Date.now().toString(),
        word: 'example',
        pronunciation: '/ɪɡˈzæmpəl/',
        meanings: [{
          partOfSpeech: 'noun',
          definition: 'A thing characteristic of its kind or illustrating a general rule.',
          example: 'This is a good example of modern architecture.'
        }],
        difficulty: 0,
        frequency: 1.0,
        addedDate: new Date().toISOString(),
        reviewCount: 0,
        passCount: 0
      },
      {
        id: (Date.now() + 1).toString(),
        word: 'vocabulary',
        pronunciation: '/vəˈkæbjʊləri/',
        meanings: [{
          partOfSpeech: 'noun',
          definition: 'The body of words used in a particular language.',
          example: 'Reading helps expand your vocabulary.'
        }],
        difficulty: 0,
        frequency: 1.0,
        addedDate: new Date().toISOString(),
        reviewCount: 0,
        passCount: 0
      }
    ];
    
    return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
  }
}