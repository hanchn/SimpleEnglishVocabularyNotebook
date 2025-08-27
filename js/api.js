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
  
  // 获取单词详情
  async getWordDetails(word) {
    try {
      const response = await fetch(`${this.DICT_API}/${word}`);
      const data = await response.json();
      return this.parseWordData(data[0]);
    } catch (error) {
      console.error('获取单词详情失败:', error);
      return null;
    }
  }
  
  // 解析单词数据
  parseWordData(data) {
    return {
      id: Date.now().toString(),
      word: data.word,
      pronunciation: data.phonetic || '',
      meanings: data.meanings.map(m => ({
        partOfSpeech: m.partOfSpeech,
        definition: m.definitions[0].definition,
        example: m.definitions[0].example || ''
      })),
      difficulty: 0,
      frequency: 1.0,
      addedDate: new Date().toISOString(),
      reviewCount: 0,
      passCount: 0
    };
  }
}