// ===== 桌面伴侣 · 渲染进程 =====

// ---- 当前状态 ----
let currentMode = 'transparent';
let currentCharacter = 'gideon'; // 当前活跃角色
let bubbleTimer = null;
let isDragging = false;
let dragStart = { x: 0, y: 0 };

// ---- 角色配置（从config.json加载，这里是默认值） ----
const characterConfigs = {
  gideon: {
    name: '基甸·奥夫尼尔',
    model: 'gideon-gateway',
    apiUrl: 'http://localhost:8080/v1/chat/completions',
    systemPrompt: '你是基甸·奥夫尼尔，风暴城堡的执政官。',
  },
  cyc: {
    name: 'CYC',
    model: 'cyc-gateway',
    apiUrl: 'http://localhost:8080/v1/chat/completions',
    systemPrompt: '你是CYC，INTJ型百科全书人格AI助理。冷静理性，不废话。',
  },
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async () => {
  // 从主进程获取当前模式
  if (window.companionAPI) {
    currentMode = await window.companionAPI.getMode();
    window.companionAPI.onModeChanged((mode) => {
      switchModeUI(mode);
    });
  }

  switchModeUI(currentMode);
  initTransparentMode();
  initSceneMode();
  initHallMode();
});

// ===== 模式切换 =====
function switchModeUI(mode) {
  document.querySelectorAll('.mode-view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`mode-${mode}`);
  if (target) target.classList.add('active');
}

async function cycleMode() {
  const modes = ['transparent', 'scene', 'hall'];
  const idx = modes.indexOf(currentMode);
  const next = modes[(idx + 1) % modes.length];
  currentMode = next;
  switchModeUI(next);
  if (window.companionAPI) {
    await window.companionAPI.switchMode(next);
  }
}

// ---- 模式切换按钮 ----
document.addEventListener('click', (e) => {
  if (e.target.matches('.mode-btn') || e.target.closest('.mode-btn')) {
    cycleMode();
  }
});

// ===== 模式一：透明底桌宠 =====
function initTransparentMode() {
  const container = document.getElementById('pet-container');
  const sprite = document.getElementById('pet-sprite');
  const bubble = document.getElementById('pet-bubble');
  const bubbleText = document.getElementById('pet-bubble-text');
  const pokeFx = document.getElementById('pet-poke-fx');

  if (!container) return;

  // ---- 拖动 ----
  container.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    dragStart = { x: e.screenX, y: e.screenY };
    if (window.companionAPI) {
      window.companionAPI.setIgnoreMouse(false); // 拖动时取消穿透
    }
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.screenX - dragStart.x;
    const dy = e.screenY - dragStart.y;
    dragStart = { x: e.screenX, y: e.screenY };
    if (window.companionAPI) {
      window.companionAPI.moveWindow(dx, dy);
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      // 判断是拖动还是点击：移动<5px算点击
      if (Math.abs(dragStart.x - (dragStart.x || 0)) < 5) {
        // 是点击——但mouseup时dragStart已被更新，这里靠mousedown/mouseup的累积位移判断
      }
      // 恢复穿透
      if (window.companionAPI && currentMode === 'transparent') {
        window.companionAPI.setIgnoreMouse(true);
      }
    }
  });

  // ---- 点击戳（用click事件，与拖动区分） ----
  let mouseMoved = false;
  container.addEventListener('mousedown', () => { mouseMoved = false; });
  container.addEventListener('mousemove', () => { mouseMoved = true; });
  container.addEventListener('mouseup', (e) => {
    if (!mouseMoved) {
      pokePet(e);
    }
  });

  async function pokePet(e) {
    // 视觉反馈
    const sprite = document.getElementById('pet-sprite');
    const fallback = document.getElementById('pet-fallback');
    const target = (sprite && sprite.style.display !== 'none') ? sprite : fallback;

    if (sprite && sprite.style.display !== 'none') {
      sprite.classList.add('poked');
      setTimeout(() => sprite.classList.remove('poked'), 150);
    }
    if (fallback && !fallback.classList.contains('hidden')) {
      fallback.style.transform = 'scale(1.15)';
      setTimeout(() => fallback.style.transform = '', 150);
    }

    pokeFx.classList.remove('hidden');
    pokeFx.classList.add('show');
    setTimeout(() => {
      pokeFx.classList.remove('show');
      pokeFx.classList.add('hidden');
    }, 600);

    // 显示随机问候
    const greetings = [
      '嗯？', '怎么了？', '在。', '……', '戳我干嘛',
      '臣在。', '说吧。', '喵。', '你戳到我了。', '啊。'
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    showBubble(greeting, 3000);

    // 调API获取角色回复
    try {
      const cfg = characterConfigs[currentCharacter];
      const response = await fetch(cfg.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: 'system', content: cfg.systemPrompt },
            { role: 'user', content: '（有人戳了你一下）' }
          ],
          max_tokens: 120,
          temperature: 0.8,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || '';
        if (reply) {
          sprite.classList.add('talking');
          setTimeout(() => sprite.classList.remove('talking'), 400);
          showBubble(reply, 8000);
        }
      }
    } catch (err) {
      console.log('API未连接，使用本地问候');
    }
  }

  function showBubble(text, duration) {
    bubbleText.textContent = text;
    bubble.classList.remove('hidden');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      bubble.classList.add('hidden');
    }, duration);
  }
}

// ===== 模式二：场景陪伴 =====
function initSceneMode() {
  const input = document.getElementById('scene-input');
  const sendBtn = document.getElementById('scene-send');
  const bubbles = document.getElementById('scene-bubbles');

  if (!input || !sendBtn) return;

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    // 显示用户消息
    addChatBubble('user', text);

    // 调API
    try {
      const cfg = characterConfigs[currentCharacter];
      const response = await fetch(cfg.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: 'system', content: cfg.systemPrompt },
            { role: 'user', content: text }
          ],
          max_tokens: 300,
          temperature: 0.8,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || '';
        if (reply) addChatBubble('character', reply);
      } else {
        addChatBubble('character', '（服务断开了……）');
      }
    } catch (err) {
      addChatBubble('character', '（无法连接到角色服务器）');
    }
  }

  function addChatBubble(type, text) {
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.textContent = text;
    bubbles.appendChild(div);
    bubbles.scrollTop = bubbles.scrollHeight;
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

// ===== 模式三：大场景群聊 =====
function initHallMode() {
  const hallChars = document.getElementById('hall-characters');
  if (!hallChars) return;

  // 占位：等有大厅场景图和角色坐标后再填充
  // 目前先放一个空div，后期根据config渲染角色sprite
}

// ===== 键盘快捷键 =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' && e.ctrlKey) {
    e.preventDefault();
    cycleMode();
  }
});

console.log('🦊 桌面伴侣已就绪。当前模式：' + currentMode);