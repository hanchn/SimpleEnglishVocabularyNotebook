// Chrome插件存储管理
class ChromeStorageManager {
  constructor() {
    this.WORDS_KEY = 'vocabulary_words';
    this.STATS_KEY = 'vocabulary_stats';
  }
  
  // 获取所有单词
  async getAllWords() {
    try {
      const result = await chrome.storage.local.get([this.WORDS_KEY]);
      return result[this.WORDS_KEY] || [];
    } catch (error) {
      console.error('获取单词失败:', error);
      return [];
    }
  }
  
  // 保存单词
  async saveWord(word) {
    try {
      const words = await this.getAllWords();
      const existingIndex = words.findIndex(w => w.id === word.id);
      
      if (existingIndex >= 0) {
        words[existingIndex] = word;
      } else {
        words.push(word);
      }
      
      await chrome.storage.local.set({ [this.WORDS_KEY]: words });
    } catch (error) {
      console.error('保存单词失败:', error);
    }
  }
  
  // 获取统计数据
  async getStats() {
    try {
      const result = await chrome.storage.local.get([this.STATS_KEY]);
      return result[this.STATS_KEY] || null;
    } catch (error) {
      console.error('获取统计失败:', error);
      return null;
    }
  }
  
  // 更新统计数据
  async updateStats(updates) {
    try {
      const stats = await this.getStats() || {};
      Object.assign(stats, updates);
      await chrome.storage.local.set({ [this.STATS_KEY]: stats });
    } catch (error) {
      console.error('更新统计失败:', error);
    }
  }
  
  // 初始化统计数据
  async initializeStats() {
    const stats = await this.getStats();
    if (!stats) {
      const initialStats = {
        totalWords: 0,
        streakDays: 0,
        lastStudyDate: null,
        totalReviews: 0,
        correctAnswers: 0,
        accuracy: 0
      };
      await this.updateStats(initialStats);
    }
  }
}