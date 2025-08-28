// API管理
class APIManager {
  constructor() {
    // 使用Free Dictionary API
    this.DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
    // 常用英语单词列表用于随机选择
    this.commonWords = [
      'apple', 'book', 'cat', 'dog', 'elephant', 'friend', 'good', 'happy',
      'important', 'journey', 'knowledge', 'love', 'music', 'nature', 'ocean',
      'peace', 'question', 'river', 'smile', 'time', 'understand', 'voice',
      'water', 'year', 'beautiful', 'create', 'develop', 'energy', 'future',
      'growth', 'health', 'idea', 'learn', 'moment', 'opportunity', 'problem',
      'quality', 'reason', 'success', 'technology', 'universe', 'value',
      'wonder', 'experience', 'challenge', 'discover', 'explore', 'imagine',
      'inspire', 'journey', 'knowledge', 'language', 'memory', 'practice'
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
      throw error; // 抛出错误，不提供备用数据
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
      // 优先选择有音频的音标，否则选择第一个有文本的音标
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
        })).filter(m => m.definition) // 过滤掉没有定义的词义
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
  
  async getWordImage(word) {
    try {
      const searchTerm = encodeURIComponent(word);
      
      // 方案1: 使用Unsplash免费API（更相关的图片）
      const unsplashUrl = `https://source.unsplash.com/300x200/?${searchTerm}`;
      
      // 方案2: 使用Pixabay免费API（需要注册但免费）
      // const pixabayUrl = `https://pixabay.com/api/?key=YOUR_KEY&q=${searchTerm}&image_type=photo&per_page=3`;
      
      return {
        url: unsplashUrl,
        alt: `Image related to ${word}`,
        fallback: `https://via.placeholder.com/300x200/4CAF50/white?text=${searchTerm}`
      };
    } catch (error) {
      console.error('获取图片失败:', error);
      return {
        url: `https://via.placeholder.com/300x200/4CAF50/white?text=${encodeURIComponent(word)}`,
        alt: `Placeholder for ${word}`,
        fallback: null
      };
    }
  }
}