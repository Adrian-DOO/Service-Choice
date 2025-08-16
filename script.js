// Questions data - 업데이트된 7문항
const QUESTIONS = [
  { id: "Q1", text: "어떤 분야의 매장을 운영하고 계신가요?", options: ["외식업","카페","피트니스","병의원/한의원","뷰티","기타"] },
  { id: "Q2", text: "매장에서 제공하는 서비스는?", options: ["1회성 서비스","정기적 서비스"] },
  { id: "Q3", text: "우리 매장만의 멤버십 서비스 도입 의사가 있나요?", options: ["있음","없음"] },
  { id: "Q4", text: "한 달 기준, 재방문 고객의 구매 비중은 어느 정도인가요?", options: ["30% 미만","30% 이상"] },
  { id: "Q5", text: "고객 데이터를 수집하고 계신가요?", options: ["데이터 없음","POS 연동 데이터가 있음","자체관리(엑셀, 구글시트 등) 중임"] },
  { id: "Q6", text: "카카오톡, SMS 등 메시지를 활용하고 계신가요?", options: ["전혀 사용하지 않음","비정기적인 발송","정기적인 발송","고객 맞춤형 메시지 발송"] },
  { id: "Q7", text: "정기적인 CRM 이벤트 기획, 운영, 메시지 발송, 직접 운영 가능하신가요?", options: ["직접 운영 가능","직접 운영 어려움"] },
];

// State management
let currentStep = 0;
let answers = {};
let selectedAnswer = null;

// DOM elements
const landingScreen = document.getElementById('landing-screen');
const startBtn = document.getElementById('start-btn');
const backBtn = document.getElementById('back-btn');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const questionNumber = document.getElementById('question-number');
const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers-container');
const surveyScreen = document.getElementById('survey-screen');
const resultScreen = document.getElementById('result-screen');
const restartBtn = document.getElementById('restart-btn');

// Initialize survey when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    init();
});

// Initialize survey
function init() {
    // Event listeners
    startBtn.addEventListener('click', startSurvey);
    backBtn.addEventListener('click', goBack);
    restartBtn.addEventListener('click', restart);
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);
}

// Start survey from landing page
function startSurvey() {
    landingScreen.classList.add('hidden');
    surveyScreen.classList.remove('hidden');
    renderQuestion();
    updateProgress();
}

// Render current question
function renderQuestion() {
    const question = QUESTIONS[currentStep];
    
    questionNumber.textContent = question.id + '.';
    questionText.textContent = question.text;
    
    // Clear and populate answers
    answersContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'answer-button';
        button.textContent = option;
        button.dataset.value = option;
        button.dataset.testid = `button-answer-${index}`;
        button.addEventListener('click', () => selectAnswerAndAdvance(option, button));
        answersContainer.appendChild(button);
    });
    
    // Reset selection
    selectedAnswer = null;
    
    // Update navigation
    backBtn.disabled = currentStep === 0;
    
    // Update aria-live region for screen readers
    questionText.setAttribute('aria-live', 'polite');
}

// Select answer and automatically advance
function selectAnswerAndAdvance(value, button) {
    // Remove previous selection
    document.querySelectorAll('.answer-button').forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
    });
    
    // Add selection to clicked button
    button.classList.add('selected');
    button.setAttribute('aria-pressed', 'true');
    selectedAnswer = value;
    
    // Auto-advance after a short delay for visual feedback
    setTimeout(() => {
        goNext();
    }, 300);
}

// Update progress
function updateProgress() {
    const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
    progressFill.style.width = progress + '%';
    progressText.textContent = `${currentStep + 1}/${QUESTIONS.length}`;
}

// Navigation functions
function goBack() {
    if (currentStep > 0) {
        currentStep--;
        renderQuestion();
        updateProgress();
    }
}

function goNext() {
    if (selectedAnswer) {
        answers[QUESTIONS[currentStep].id] = selectedAnswer;
        
        if (currentStep < QUESTIONS.length - 1) {
            currentStep++;
            renderQuestion();
            updateProgress();
        } else {
            showResult();
        }
    }
}

// 인사이트 태그 생성
function getTags(a){
  const tags = [];

  // 고객 구조
  if (a.Q2 === "1회성 서비스") tags.push("#1회성_매장");
  if (a.Q2 === "정기적 서비스") tags.push("#정기구매_서비스");
  if (a.Q2 === "1회성 서비스" && a.Q3 === "있음") tags.push("#멤버십_확장_가능");

  // 리텐션
  if (a.Q4 === "30% 미만") tags.push("#재방문율_낮음");
  if (a.Q4 === "30% 이상") tags.push("#단골고객_비중높음");

  // 데이터
  if (a.Q5 === "데이터 없음") tags.push("#고객데이터_부재");
  if (a.Q5 === "POS 연동 데이터가 있음") tags.push("#POS연동");
  if (a.Q5 === "자체관리(엑셀, 구글시트 등) 중임") tags.push("#수기데이터");

  // 메시지 운영
  if (a.Q6 === "전혀 사용하지 않음") tags.push("#메시지_미활용");
  if (a.Q6 === "비정기적으로 사용하고 있음") tags.push("#비정기메시지");
  if (a.Q6 === "정기적으로 사용하고 있음") tags.push("#정기메시지");
  if (a.Q6 === "고객 세그먼트에 따라 개인화 메시지를 사용하고 있음") tags.push("#개인화메시지");

  // 운영 역량
  if (a.Q7 === "직접 운영 가능") tags.push("#직접운영_가능");
  if (a.Q7 === "직접 운영 어려움") tags.push("#운영지원_필요");

  return tags;
}

// 다중 서비스 추천 계산
function computeServices(a){
  // 규칙: 우선순위 높은 진단 예외 먼저
  const needDiagnosis =
    (a.Q2 === "1회성 서비스" && a.Q3 === "없음") ||
    a.Q5 === "데이터 없음" ||
    a.Q6 === "전혀 사용하지 않음";

  const isRecurringOrMembership = (a.Q2 === "정기적 서비스") || (a.Q2 === "1회성 서비스" && a.Q3 === "있음");
  const hasData = (a.Q5 === "POS 연동 데이터가 있음") || (a.Q5 === "자체관리(엑셀, 구글시트 등) 중임");
  const opsCan = (a.Q7 === "직접 운영 가능");
  const opsHard = (a.Q7 === "직접 운영 어려움");
  const msgAdvanced = (a.Q6 === "정기적으로 사용하고 있음") || (a.Q6 === "고객 세그먼트에 따라 개인화 메시지를 사용하고 있음");

  const services = {
    core: [],    // 🟢 필수
    optional: [],// 🟡 보조
    future: []   // 🔵 향후
  };

  // 코어 후보 계산
  if (needDiagnosis) services.core.push("매장 진단 컨설팅");

  if (isRecurringOrMembership && hasData && opsCan){
    services.core.push("AI CRM 시스템 구축 대행");
  }

  if (isRecurringOrMembership && hasData && msgAdvanced && opsHard){
    services.core.push("CRM 마케팅 대행");
  }

  // 코어가 비었으면 합리적 기본값
  if (services.core.length === 0){
    // 데이터/의지 따져 최소 1개 보장
    if (isRecurringOrMembership && hasData){
      services.core.push(opsCan ? "AI CRM 시스템 구축 대행" : "CRM 마케팅 대행");
    } else {
      services.core.push("매장 진단 컨설팅");
    }
  }

 // 보조/향후 추천 (중첩 제안)
  // 리텐션 낮음이면 시스템/운영 보강 제안
  if (a.Q4 === "30% 미만" && isRecurringOrMembership && hasData){
    if (!services.core.includes("AI CRM 시스템 구축 대행")) services.optional.push("AI CRM 시스템 구축 대행");
    if (opsHard && !services.core.includes("CRM 마케팅 대행")) services.optional.push("CRM 마케팅 대행");
  }

  // 데이터 부재가 아니고 메시지가 비정기 → 자동화 보강
  if (hasData && a.Q6 === "비정기적으로 사용하고 있음"){
    if (!services.core.includes("AI CRM 시스템 구축 대행")) services.optional.push("AI CRM 시스템 구축 대행");
  }

  // 확장 단계(멤버십 의사 有이거나 개인화 운영 중) → 전략 리프레시
  if (a.Q3 === "있음" || a.Q6 === "고객 세그먼트에 따라 개인화 메시지를 사용하고 있음"){
    if (!services.core.includes("매장 진단 컨설팅")) services.future.push("매장 진단 컨설팅");
  }

  // 중복 제거
  for (const k of ["core","optional","future"]){
    services[k] = [...new Set(services[k])];
  }
  return services;
}

// 결과 렌더링 (다중 추천)
function renderResult(answers){
  const tags = getTags(answers);
  const recs = computeServices(answers);
  const root = document.getElementById("result-root");
  const restart = document.getElementById("restart-btn");
  if (!root) return;

  const storeType = answers.Q1 ? `선택 업종: ${answers.Q1}` : "";

  const block = (title, items, color) => items.length
    ? `<div class="result-block">
         <div class="result-title" data-color="${color}">${title}</div>
         <ul class="result-list">${items.map(s=>`<li>${s}</li>`).join("")}</ul>
       </div>` : "";

  const insights = tags.length ? `<div class="tags">${tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>` : "";

  root.innerHTML = `
    <div class="result-card">
      <h2 class="result-headline">추천 결과</h2>
      <p class="muted">${storeType}</p>
      ${block("필수", recs.core, "green")}
      ${block("보조", recs.optional, "amber")}
      ${block("향후 고려", recs.future, "blue")}
      <hr/>
      <div class="insight-wrap">
        <div class="insight-title">인사이트 태그</div>
        ${insights || "<p class='muted'>선택된 인사이트 없음</p>"}
      </div>
    </div>
  `;
  root.hidden = false;
  if (restart){ restart.hidden = false; }
}

// Show result screen
function showResult() {
    renderResult(answers);
    
    // Show result screen
    surveyScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    // Focus on result for accessibility
    const resultHeadline = document.querySelector('.result-headline');
    if (resultHeadline) resultHeadline.focus();
}

// Restart survey
function restart() {
    currentStep = 0;
    answers = {};
    selectedAnswer = null;
    
    resultScreen.classList.add('hidden');
    surveyScreen.classList.add('hidden');
    landingScreen.classList.remove('hidden');
}

// Keyboard navigation
function handleKeyboard(e) {
    // Landing screen
    if (!landingScreen.classList.contains('hidden')) {
        if (e.key === 'Enter' && document.activeElement === startBtn) {
            startSurvey();
        }
        return;
    }
    
    // Survey screen
    if (!surveyScreen.classList.contains('hidden')) {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                if (!backBtn.disabled) goBack();
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                e.preventDefault();
                navigateAnswers(e.key === 'ArrowUp' ? -1 : 1);
                break;
            case 'Enter':
                e.preventDefault();
                if (document.activeElement.classList.contains('answer-button')) {
                    const button = document.activeElement;
                    selectAnswerAndAdvance(button.dataset.value, button);
                }
                break;
            case ' ':
                e.preventDefault();
                if (document.activeElement.classList.contains('answer-button')) {
                    const button = document.activeElement;
                    selectAnswerAndAdvance(button.dataset.value, button);
                }
                break;
        }
    } else if (!resultScreen.classList.contains('hidden')) {
        // Result screen keyboard navigation
        if (e.key === 'Enter' && document.activeElement === restartBtn) {
            restart();
        }
    }
}

// Navigate through answers with keyboard
function navigateAnswers(direction) {
    const buttons = document.querySelectorAll('.answer-button');
    let currentIndex = -1;
    
    // Find currently focused or selected button
    buttons.forEach((btn, index) => {
        if (btn === document.activeElement || btn.classList.contains('selected')) {
            currentIndex = index;
        }
    });
    
    // Calculate new index
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = buttons.length - 1;
    if (newIndex >= buttons.length) newIndex = 0;
    
    // Focus new button
    if (buttons[newIndex]) {
        buttons[newIndex].focus();
    }
}

// Add click handlers for improved touch support
document.addEventListener('touchstart', function() {}, { passive: true });

// Prevent zoom on double tap for better mobile experience
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
