// Chrome插件API管理
class ChromeAPIManager {
  constructor() {
    this.DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
    this.commonWords = [
      'apple', 'book', 'cat', 'dog', 'elephant', 'friend', 'good', 'happy',
      'important', 'journey', 'knowledge', 'love', 'music', 'nature', 'ocean',
      'peace', 'question', 'river', 'smile', 'time', 'understand', 'voice',
      'water', 'year', 'beautiful', 'create', 'develop', 'energy', 'future',
      'growth', 'health', 'idea', 'learn', 'moment', 'opportunity', 'problem',
      'quality', 'reason', 'success', 'technology', 'universe', 'value',
      'wonder', 'experience', 'challenge', 'discover', 'explore', 'imagine'
    ];
  }
  
  // 获取随机单词
  async getRandomWord() {
    const randomWord = this.getRandomWordFromList();
    return await this.getWordDetails(randomWord);
  }
  
  // 从单词列表中随机选择
  getRandomWordFromList() {
    return this.commonWords[Math.floor(Math.random() * this.commonWords.length)];
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
      console.error('获取单词详情失败:', error);
      throw error;
    }
  }
  
  // 解析单词数据
  parseWordData(data) {
    if (!data || !data.word) {
      throw new Error('Invalid word data');
    }
    
    // 提取音标
    let pronunciation = '';
    if (data.phonetic) {
      pronunciation = data.phonetic;
    } else if (data.phonetics && data.phonetics.length > 0) {
      const phoneticWithAudio = data.phonetics.find(p => p.text && p.audio);
      const phoneticWithText = data.phonetics.find(p => p.text);
      pronunciation = (phoneticWithAudio || phoneticWithText)?.text || '';
    }
    
    // 解析词义
    const meanings = data.meanings && data.meanings.length > 0 
      ? data.meanings.slice(0, 3).map(m => ({
          partOfSpeech: m.partOfSpeech || 'unknown',
          definition: (m.definitions && m.definitions[0] && m.definitions[0].definition) || '',
          example: (m.definitions && m.definitions[0] && m.definitions[0].example) || ''
        })).filter(m => m.definition)
      : [];
    
    if (meanings.length === 0) {
      throw new Error('No valid meanings found');
    }
    
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
}