// API管理
class APIManager {
  constructor() {
    // 使用免费的Dictionary API（无需token）
    this.DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
    // 备用单词列表（当API不可用时使用）
    this.fallbackWordsList = [
      'example', 'vocabulary', 'language', 'study', 'learn', 'practice',
      'memory', 'knowledge', 'education', 'skill', 'ability', 'progress',
      'achievement', 'success', 'challenge', 'opportunity', 'experience',
      'development', 'improvement', 'understanding', 'communication'
    ];
  }
  
  // 获取随机单词 - 改用本地单词列表
  async getRandomWord() {
    // 先尝试从本地单词列表获取
    const randomWord = this.getRandomWordFromList();
    
    try {
      // 尝试获取详细信息
      const wordDetails = await this.getWordDetails(randomWord);
      if (wordDetails) {
        return wordDetails;
      }
    } catch (error) {
      console.log('API调用失败，使用备用数据:', error);
    }
    
    // 如果API失败，返回备用单词
    return this.getFallbackWord(randomWord);
  }
  
  // 从单词列表中随机选择
  getRandomWordFromList() {
    return this.fallbackWordsList[Math.floor(Math.random() * this.fallbackWordsList.length)];
  }
  
  // 获取单词详情
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
      console.log('获取单词详情失败:', error);
      return null;
    }
  }
  
  // 解析单词数据
  parseWordData(data) {
    if (!data || !data.word) {
      return null;
    }
    
    // 提取音标
    let pronunciation = '';
    if (data.phonetic) {
      pronunciation = data.phonetic;
    } else if (data.phonetics && data.phonetics.length > 0) {
      pronunciation = data.phonetics.find(p => p.text)?.text || '';
    }
    
    // 确保meanings数组存在且不为空
    const meanings = data.meanings && data.meanings.length > 0 
      ? data.meanings.slice(0, 3).map(m => ({
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
      pronunciation: pronunciation,
      meanings: meanings,
      difficulty: 0,
      frequency: 1.0,
      addedDate: new Date().toISOString(),
      reviewCount: 0,
      passCount: 0
    };
  }
  
  // 备用单词数据 - 扩展版本
  getFallbackWord(word = null) {
    const targetWord = word || this.getRandomWordFromList();
    
    // 预定义的单词数据
    const predefinedWords = {
      'example': {
        pronunciation: '/ɪɡˈzæmpəl/',
        meanings: [{
          partOfSpeech: 'noun',
          definition: 'A thing characteristic of its kind or illustrating a general rule.',
          example: 'This is a good example of modern architecture.'
        }]
      },
      'vocabulary': {
        pronunciation: '/vəˈkæbjʊləri/',
        meanings: [{
          partOfSpeech: 'noun',
          definition: 'The body of words used in a particular language.',
          example: 'Reading helps expand your vocabulary.'
        }]
      },
      'language': {
        pronunciation: '/ˈlæŋɡwɪdʒ/',
        meanings: [{
          partOfSpeech: 'noun',
          definition: 'The method of human communication using words.',
          example: 'English is a global language.'
        }]
      },
      'study': {
        pronunciation: '/ˈstʌdi/',
        meanings: [{
          partOfSpeech: 'verb',
          definition: 'To devote time and attention to acquiring knowledge.',
          example: 'I study English every day.'
        }]
      },
      'learn': {
        pronunciation: '/lɜːrn/',
        meanings: [{
          partOfSpeech: 'verb',
          definition: 'To acquire knowledge or skill through study or experience.',
          example: 'Children learn quickly.'
        }]
      }
    };
    
    const wordData = predefinedWords[targetWord] || {
      pronunciation: '/unknown/',
      meanings: [{
        partOfSpeech: 'unknown',
        definition: '暂无释义',
        example: ''
      }]
    };
    
    return {
      id: Date.now().toString(),
      word: targetWord,
      pronunciation: wordData.pronunciation,
      meanings: wordData.meanings,
      difficulty: 0,
      frequency: 1.0,
      addedDate: new Date().toISOString(),
      reviewCount: 0,
      passCount: 0
    };
  }
}