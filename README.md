# 智能英语单词速记本 (Smart English Vocabulary Notebook)

## 项目概述

这是一个基于 Web 的智能英语单词速记应用，采用智能频次算法帮助用户高效记忆英语单词。应用支持多种学习模式，集成第三方API提供丰富的单词资源和例句，并通过本地存储实现数据持久化。

## 核心特性

### 🧠 智能频次算法
- **动态频次调整**：根据用户掌握程度自动调整单词出现频率
- **遗忘曲线优化**：基于艾宾浩斯遗忘曲线安排复习时间
- **Pass机制**：用户可以通过Pass按钮降低单词出现频率
- **智能推荐**：优先推送需要加强记忆的单词

### 📊 学习统计
- **总词汇量统计**：显示已学习单词总数
- **学习进度追踪**：记录每日学习情况
- **掌握度分析**：按熟悉程度分类统计
- **学习时长统计**：记录累计学习时间

### 🎯 多种学习模式
- **快速背诵模式**：快速浏览单词和释义
- **填写模式**：随机字母空缺，考验拼写能力
- **听写模式**：结合语音API进行听写练习
- **例句学习模式**：通过丰富例句加深理解
- **复习模式**：系统化复习已学单词

### 📚 例句模块
- **丰富例句库**：每个单词提供5-10条精选例句
- **例句朗读**：支持例句语音播放功能
- **难度分级**：例句按难度等级分类展示
- **语境学习**：通过例句理解单词在不同语境中的用法

## 功能需求详述

### 1. 智能单词管理

#### 1.1 单词获取
- **第三方API集成**：自动获取单词、音标、释义、例句
- **随机单词推送**：基于用户水平推送适合的单词
- **手动添加**：支持用户自定义添加单词
- **批量导入**：支持从文件批量导入单词

#### 1.2 智能频次系统
```javascript
// 频次计算算法
const calculateFrequency = (word) => {
  const baseFrequency = 1.0;
  const difficultyMultiplier = {
    0: 3.0,  // 不熟悉：高频出现
    1: 1.5,  // 一般：中频出现
    2: 0.5   // 熟悉：低频出现
  };
  
  const timeFactor = calculateTimeFactor(word.lastReviewed);
  const passPenalty = Math.max(0.1, 1 - (word.passCount * 0.1));
  
  return baseFrequency * 
         difficultyMultiplier[word.difficulty] * 
         timeFactor * 
         passPenalty;
};
```

### 2. 学习模式设计

#### 2.1 快速背诵模式
- **单词展示**：显示单词、音标、释义、例句
- **语音播放**：点击播放单词发音
- **快速操作**：
  - 「认识」按钮：标记为熟悉，降低出现频率
  - 「不认识」按钮：标记为不熟悉，增加出现频率
  - 「Pass」按钮：跳过当前单词，频次减1
- **自动切换**：设定时间后自动切换到下一个单词

#### 2.2 填写模式
- **随机空缺**：随机隐藏单词中的1-3个字母
- **智能空缺**：优先隐藏容易出错的字母位置
- **提示系统**：
  - 显示单词长度
  - 提供首字母提示
  - 显示音标和释义
- **输入验证**：实时检查用户输入的正确性
- **错误处理**：记录错误位置，加强练习

#### 2.3 听写模式
- **语音播放**：播放单词发音
- **拼写输入**：用户根据发音输入单词
- **重复播放**：支持多次播放
- **难度调节**：可调整播放速度

#### 2.4 例句学习模式 ⭐ 新增
- **例句展示**：
  - 每个单词显示5-10条精选例句
  - 例句按使用频率和难度排序
  - 支持中英文对照显示
- **例句朗读功能**：
  - 点击播放按钮朗读整个例句
  - 支持调节朗读速度（0.5x - 2.0x）
  - 可选择不同的语音（美式/英式）
- **交互功能**：
  - 点击例句中的单词高亮显示
  - 长按单词显示详细释义
  - 收藏喜欢的例句
- **学习辅助**：
  - 标注例句中的重点词汇
  - 显示例句的语法结构
  - 提供例句的使用场景说明

### 3. 例句模块详细设计

#### 3.1 例句数据结构
```javascript
// 例句对象结构
const exampleSentence = {
  id: 'example_id',
  sentence: 'This is a good example of how to use the word.',
  translation: '这是如何使用这个单词的一个好例子。',
  difficulty: 2,              // 难度等级 1-5
  frequency: 0.8,             // 使用频率
  source: 'oxford',           // 来源
  audioUrl: 'path/to/audio',  // 音频文件路径
  tags: ['common', 'formal'], // 标签
  context: 'academic',        // 使用语境
  grammarPoints: [            // 语法要点
    {
      type: 'phrase',
      content: 'good example of',
      explanation: '...的好例子'
    }
  ]
};
```

#### 3.2 例句获取策略
- **API优先级**：
  1. Oxford Dictionary API（高质量例句）
  2. Cambridge Dictionary API（学术例句）
  3. Collins Dictionary API（日常例句）
  4. 本地例句库（离线备份）

#### 3.3 例句筛选算法
```javascript
// 例句筛选和排序
const selectExamples = (word, userLevel) => {
  const allExamples = getExamplesFromAPI(word);
  
  // 按用户水平筛选
  const filteredExamples = allExamples.filter(example => {
    return example.difficulty <= userLevel + 1 && 
           example.difficulty >= userLevel - 1;
  });
  
  // 按质量排序
  return filteredExamples
    .sort((a, b) => {
      const scoreA = calculateExampleScore(a, word);
      const scoreB = calculateExampleScore(b, word);
      return scoreB - scoreA;
    })
    .slice(0, 10); // 取前10条
};

// 例句质量评分
const calculateExampleScore = (example, targetWord) => {
  let score = 0;
  
  // 长度适中加分
  const length = example.sentence.split(' ').length;
  if (length >= 8 && length <= 20) score += 2;
  
  // 常用词汇加分
  if (example.frequency > 0.7) score += 3;
  
  // 语法清晰加分
  if (example.grammarPoints.length > 0) score += 1;
  
  // 目标单词使用自然加分
  const wordUsage = analyzeWordUsage(example.sentence, targetWord);
  if (wordUsage.natural) score += 2;
  
  return score;
};
```

### 4. 语音功能增强

#### 4.1 例句朗读系统
- **多语音引擎支持**：
  - Web Speech API（浏览器原生）
  - Google Text-to-Speech（高质量）
  - Azure Cognitive Services（多语音选择）
  - 本地TTS引擎（离线支持）

#### 4.2 语音控制功能
```javascript
// 例句朗读控制
class SentenceSpeaker {
  constructor() {
    this.currentUtterance = null;
    this.isPlaying = false;
    this.speed = 1.0;
    this.voice = 'en-US';
  }
  
  // 朗读例句
  speakSentence(sentence, options = {}) {
    this.stop(); // 停止当前播放
    
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = options.speed || this.speed;
    utterance.lang = options.voice || this.voice;
    utterance.volume = options.volume || 1.0;
    
    // 高亮当前朗读的单词
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        this.highlightWord(event.charIndex, event.charLength);
      }
    };
    
    utterance.onend = () => {
      this.isPlaying = false;
      this.clearHighlight();
    };
    
    this.currentUtterance = utterance;
    this.isPlaying = true;
    speechSynthesis.speak(utterance);
  }
  
  // 暂停/继续
  togglePlayback() {
    if (this.isPlaying) {
      speechSynthesis.pause();
    } else {
      speechSynthesis.resume();
    }
  }
  
  // 停止朗读
  stop() {
    if (this.currentUtterance) {
      speechSynthesis.cancel();
      this.isPlaying = false;
      this.clearHighlight();
    }
  }
}
```

### 5. 统计与分析

#### 5.1 学习统计面板
```javascript
// 增强的统计数据结构
const learningStats = {
  totalWords: 0,           // 总单词数
  masteredWords: 0,        // 已掌握单词数
  learningWords: 0,        // 学习中单词数
  difficultWords: 0,       // 困难单词数
  todayLearned: 0,         // 今日学习数
  todayReviewed: 0,        // 今日复习数
  totalLearningTime: 0,    // 总学习时长（分钟）
  streakDays: 0,           // 连续学习天数
  averageAccuracy: 0,      // 平均正确率
  
  // 例句相关统计 ⭐ 新增
  examplesStudied: 0,      // 已学习例句数
  favoriteExamples: 0,     // 收藏例句数
  listeningTime: 0,        // 例句听力时长
  exampleAccuracy: 0       // 例句理解正确率
};
```

#### 5.2 可视化图表
- **学习进度条**：显示整体学习进度
- **每日学习曲线**：展示近30天学习情况
- **掌握度饼图**：按熟悉程度分类显示
- **错误率分析**：统计常见错误类型
- **例句学习统计**：例句学习时长和效果分析 ⭐ 新增

### 6. 第三方API集成

#### 6.1 单词和例句数据API
- **Oxford Dictionaries API**：
  - 获取权威单词定义和例句
  - 提供音标和语音文件
  - 支持词性变化和搭配
- **Cambridge Dictionary API**：
  - 学习者友好的例句
  - 语法要点标注
  - 使用频率数据
- **Free Dictionary API**：
  - 免费基础单词信息
  - 简单例句获取
  - 备用数据源
- **WordsAPI**：
  - 单词难度评级
  - 同义词反义词
  - 词汇关联度

#### 6.2 语音合成API
- **Web Speech API**：浏览器原生语音合成
- **Google Cloud Text-to-Speech**：高质量多语音
- **Azure Cognitive Services**：自然语音合成
- **Amazon Polly**：神经网络语音

### 7. 数据结构设计

```javascript
// 增强的单词对象结构
const wordItem = {
  id: 'unique_id',              // 唯一标识符
  word: 'example',              // 英文单词
  pronunciation: '/ɪɡˈzæmpl/',  // 音标
  meanings: [                   // 多个释义
    {
      partOfSpeech: 'noun',     // 词性
      definition: '例子，实例',   // 中文释义
      example: 'This is an example.' // 基础例句
    }
  ],
  
  // 例句相关 ⭐ 新增
  examples: [                   // 丰富例句库
    {
      id: 'ex_1',
      sentence: 'This is a perfect example of modern architecture.',
      translation: '这是现代建筑的完美例子。',
      difficulty: 3,
      audioUrl: 'path/to/audio.mp3',
      isFavorite: false,
      studiedCount: 0,
      lastStudied: null
    }
  ],
  
  difficulty: 0,                // 熟悉度 (0:不熟悉, 1:一般, 2:熟悉)
  frequency: 1.0,               // 当前出现频率
  addedDate: '2024-01-01',      // 添加日期
  lastReviewed: '2024-01-01',   // 最后复习日期
  reviewCount: 0,               // 复习次数
  passCount: 0,                 // Pass次数
  correctCount: 0,              // 正确次数
  wrongCount: 0,                // 错误次数
  averageResponseTime: 0,       // 平均反应时间
  errorPositions: [],           // 常错字母位置
  source: 'api',                // 来源：api/manual
  tags: [],                     // 标签分类
  
  // 例句学习记录 ⭐ 新增
  exampleStats: {
    totalExamplesStudied: 0,    // 学习过的例句总数
    favoriteExamples: [],       // 收藏的例句ID
    listeningTime: 0,           // 例句听力总时长
    comprehensionRate: 0        // 例句理解正确率
  }
};

// 学习会话记录
const learningSession = {
  id: 'session_id',
  startTime: '2024-01-01T10:00:00Z',
  endTime: '2024-01-01T10:30:00Z',
  mode: 'example_learning',     // 新增例句学习模式
  wordsStudied: [],             // 学习的单词ID列表
  examplesStudied: [],          // 学习的例句ID列表 ⭐ 新增
  totalWords: 20,               // 总单词数
  totalExamples: 45,            // 总例句数 ⭐ 新增
  correctAnswers: 18,           // 正确答案数
  accuracy: 0.9,                // 正确率
  averageTime: 3.5,             // 平均每词时间（秒）
  listeningTime: 180            // 例句听力时长（秒）⭐ 新增
};
```

### 8. 界面设计

#### 8.1 主界面布局
- **顶部状态栏**：显示学习统计、连续天数
- **模式切换区**：快速背诵、填写模式、听写模式、例句学习 ⭐ 新增
- **学习区域**：根据模式显示不同的学习界面
- **操作按钮区**：认识/不认识/Pass/设置按钮
- **进度指示器**：当前会话进度

#### 8.2 例句学习界面 ⭐ 新增
- **单词卡片区**：
  - 单词、音标、基本释义
  - 单词发音按钮
- **例句展示区**：
  - 例句列表（5-10条）
  - 每条例句的播放按钮
  - 中英文切换按钮
  - 收藏按钮
- **播放控制区**：
  - 播放/暂停按钮
  - 速度调节滑块
  - 语音选择下拉菜单
- **学习辅助区**：
  - 例句难度标识
  - 语法要点提示
  - 使用场景说明

#### 8.3 统计面板
- **总览卡片**：总词汇量、掌握率、学习天数
- **今日统计**：今日新学、复习、正确率
- **图表区域**：学习曲线、掌握度分布
- **例句统计**：例句学习时长、收藏数量 ⭐ 新增
- **成就系统**：学习里程碑和徽章

#### 8.4 设置页面
- **学习偏好**：每日目标、提醒设置
- **模式配置**：各模式的参数调整
- **语音设置**：语音选择、速度偏好 ⭐ 新增
- **例句偏好**：例句数量、难度范围 ⭐ 新增
- **API配置**：第三方服务设置
- **数据管理**：导入/导出/备份

### 9. 技术实现

#### 9.1 前端技术栈
- **HTML5**：语义化页面结构
- **CSS3**：现代化样式设计，支持暗色模式
- **JavaScript (ES6+)**：模块化业务逻辑
- **Chart.js**：数据可视化图表
- **Howler.js**：音频播放控制 ⭐ 新增
- **Web APIs**：Speech Synthesis, Local Storage, Fetch

#### 9.2 核心算法
- **智能频次算法**：动态调整单词出现概率
- **间隔重复算法**：基于遗忘曲线的复习安排
- **难度评估算法**：根据用户表现评估单词难度
- **例句筛选算法**：智能选择最适合的例句 ⭐ 新增
- **个性化推荐**：基于学习历史推荐合适单词

#### 9.3 性能优化
- **懒加载**：按需加载单词和例句数据
- **缓存策略**：API响应缓存，减少网络请求
- **音频预加载**：预加载常用例句音频 ⭐ 新增
- **离线支持**：Service Worker实现离线功能
- **数据压缩**：本地存储数据压缩

### 10. 文件结构