
### 11. 开发路线图

#### Phase 1: 基础框架 (Week 1-2)
- [x] 项目结构搭建
- [ ] 基础UI界面
- [ ] 本地存储系统
- [ ] 基础单词管理

#### Phase 2: 核心功能 (Week 3-4)
- [ ] 智能频次算法实现
- [ ] 快速背诵模式
- [ ] 第三方API集成
- [ ] 基础统计功能

#### Phase 3: 高级功能 (Week 5-6)
- [ ] 填写模式实现
- [ ] 听写模式开发
- [ ] 例句学习模式开发 ⭐ 新增
- [ ] 例句朗读功能集成 ⭐ 新增
- [ ] 高级统计和图表
- [ ] 语音合成集成

#### Phase 4: 优化完善 (Week 7-8)
- [ ] 性能优化
- [ ] 音频缓存和预加载 ⭐ 新增
- [ ] 用户体验改进
- [ ] 离线功能支持
- [ ] 测试和调试

### 12. API集成方案

#### 12.1 例句获取API ⭐ 新增
```javascript
// 获取单词例句
const fetchWordExamples = async (word, count = 10) => {
  try {
    // 优先使用Oxford API
    let examples = await fetchFromOxford(word, count);
    
    // 如果数量不足，补充Cambridge API
    if (examples.length < count) {
      const additionalExamples = await fetchFromCambridge(word, count - examples.length);
      examples = [...examples, ...additionalExamples];
    }
    
    // 最后使用Free Dictionary API补充
    if (examples.length < count) {
      const freeExamples = await fetchFromFreeDictionary(word, count - examples.length);
      examples = [...examples, ...freeExamples];
    }
    
    return processExamples(examples, word);
  } catch (error) {
    console.error('获取例句失败:', error);
    return getLocalExamples(word); // 使用本地例句库
  }
};

// 处理和优化例句
const processExamples = (examples, targetWord) => {
  return examples
    .filter(ex => ex.sentence.toLowerCase().includes(targetWord.toLowerCase()))
    .map(ex => ({
      ...ex,
      score: calculateExampleScore(ex, targetWord),
      audioUrl: generateAudioUrl(ex.sentence)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
};
```

#### 12.2 语音合成增强 ⭐ 新增
```javascript
// 例句语音播放管理
class ExampleAudioManager {
  constructor() {
    this.audioCache = new Map();
    this.currentAudio = null;
    this.isPlaying = false;
  }
  
  // 播放例句
  async playExample(sentence, options = {}) {
    const audioKey = `${sentence}_${options.voice || 'default'}_${options.speed || 1}`;
    
    // 检查缓存
    if (this.audioCache.has(audioKey)) {
      const audio = this.audioCache.get(audioKey);
      this.playAudio(audio);
      return;
    }
    
    // 生成新的音频
    try {
      const audioBlob = await this.generateAudio(sentence, options);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // 缓存音频
      this.audioCache.set(audioKey, audio);
      this.playAudio(audio);
    } catch (error) {
      // 降级到Web Speech API
      this.fallbackToSpeechAPI(sentence, options);
    }
  }
  
  // 生成音频文件
  async generateAudio(text, options) {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: options.voice || 'en-US-Standard-A',
        speed: options.speed || 1.0
      })
    });
    
    return await response.blob();
  }
  
  // 播放音频
  playAudio(audio) {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    
    this.currentAudio = audio;
    this.isPlaying = true;
    
    audio.onended = () => {
      this.isPlaying = false;
    };
    
    audio.play();
  }
  
  // 降级到Web Speech API
  fallbackToSpeechAPI(text, options) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.speed || 1.0;
    utterance.lang = options.voice || 'en-US';
    speechSynthesis.speak(utterance);
  }
}
```

### 13. 使用指南

#### 13.1 快速开始
1. 打开应用，选择学习模式
2. 系统自动推送适合的单词
3. 根据熟悉程度点击相应按钮
4. 查看学习统计和进度

#### 13.2 例句学习模式使用 ⭐ 新增
1. **进入例句模式**：点击"例句学习"标签
2. **浏览例句**：查看5-10条精选例句
3. **听例句**：点击播放按钮听例句朗读
4. **调节设置**：调整朗读速度和语音类型
5. **收藏例句**：点击收藏按钮保存喜欢的例句
6. **理解检测**：系统会询问例句理解情况

#### 13.3 高级功能
- **智能推荐**：系统根据学习情况智能推荐
- **个性化设置**：调整学习参数和目标
- **数据分析**：深入了解学习效果
- **例句收藏**：建立个人例句库 ⭐ 新增

## 技术支持

- **浏览器兼容性**：Chrome 80+, Firefox 75+, Safari 13+
- **网络要求**：首次使用需要网络连接获取单词和例句数据
- **存储空间**：建议预留100MB本地存储空间（包含音频缓存）⭐ 更新
- **音频支持**：支持Web Audio API和HTML5 Audio ⭐ 新增

## 更新日志

### v2.1.0 (开发中) ⭐ 新增
- ✨ 例句学习模块
- ✨ 例句朗读功能
- ✨ 音频缓存系统
- ✨ 例句收藏功能
- ✨ 多语音引擎支持

### v2.0.0 (开发中)
- ✨ 智能频次算法
- ✨ 填写模式和听写模式
- ✨ 第三方API集成
- ✨ 高级统计功能
- ✨ 语音合成支持

---

**开发状态**: 🚧 积极开发中

**最后更新**: 2024年1月