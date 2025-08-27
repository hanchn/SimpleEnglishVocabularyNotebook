// 本地存储管理
class StorageManager {
  constructor() {
    this.WORDS_KEY = 'vocabulary_words';
    this.STATS_KEY = 'vocabulary_stats';
  }
  
  // 获取所有单词
  getAllWords() {
    const data = localStorage.getItem(this.WORDS_KEY);
    return data ? JSON.parse(data) : [];
  }
  
  // 保存单词
  saveWord(word) {
    const words = this.getAllWords();
    const existingIndex = words.findIndex(w => w.id === word.id);
    
    if (existingIndex >= 0) {
      words[existingIndex] = word;
    } else {
      words.push(word);
    }
    
    localStorage.setItem(this.WORDS_KEY, JSON.stringify(words));
  }
  
  // 获取统计数据
  getStats() {
    const data = localStorage.getItem(this.STATS_KEY);
    return data ? JSON.parse(data) : null; // 返回null而不是默认数据
  }
  
  // 更新统计数据
  updateStats(updates) {
    const stats = this.getStats() || {}; // 如果没有数据则创建空对象
    Object.assign(stats, updates);
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  }
  
  // 初始化统计数据（仅在第一次使用时调用）
  initializeStats() {
    if (!this.getStats()) {
      const initialStats = {
        totalWords: 0,
        streakDays: 0,
        lastStudyDate: null,
        totalReviews: 0,
        correctAnswers: 0,
        accuracy: 0
      };
      this.updateStats(initialStats);
    }
  }
}