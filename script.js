document.addEventListener("DOMContentLoaded", function () {
    // —— 状态与定时器（都只做这件事：要么开，要么关）——
    let sessionActive = false;       // 当前是否在一次“考试会话”中
    let preIntervalId = null;        // 5 秒“准备倒计时”的 interval
    let mainIntervalId = null;       // 10 秒“正式倒计时”的 interval

    // —— DOM 引用（都是真名实姓，读起来不费劲）——
    const btnStart = document.getElementById("btn-start");
    const home = document.getElementById("home");
    const quiz = document.getElementById("quiz");
    const timerSpan = document.getElementById("timer");

    const questionEl = document.getElementById("question-text");
    const optionA = document.getElementById("btn-option-a");
    const optionB = document.getElementById("btn-option-b");
    const optionC = document.getElementById("btn-option-c");
    const optionD = document.getElementById("btn-option-d");

    const preHint = document.getElementById("pre-hint");
    const examRemain = document.getElementById("exam-remaining-time");

    const btnExit = document.getElementById("btn-exit");

    const modal = document.getElementById("exit-modal");
    const btnYes = document.getElementById("btn-exit-yes");
    const btnNo = document.getElementById("btn-exit-no");

    function resetQuizUI() {
        // 题干先用占位（保持你想要的默认值）
        questionEl.textContent = "题干";

        // 选项也先用占位
        optionA.textContent = "选项 A";
        optionB.textContent = "选项 B";
        optionC.textContent = "选项 C";
        optionD.textContent = "选项 D";

        // 计时占位
        timerSpan.style.color = "black";
        timerSpan.textContent = "请在 10.0 秒内作答";

        // 预提示先隐藏（startPreCountdown 会显示并驱动它）
        if (preHint) {
            preHint.style.display = "none";
            if (examRemain) examRemain.textContent = "5.0";
        }
    }

    // 工具：清空所有计时器
    function clearAllTimers() {
        if (preIntervalId) {
            clearInterval(preIntervalId);
            preIntervalId = null;
        }
        if (mainIntervalId) {
            clearInterval(mainIntervalId);
            mainIntervalId = null;
        }
    }

    // 第一步：显示 5 秒“准备倒计时”，结束后再真正加载题目并开始 10 秒倒计时
    function startPreCountdown() {
        preHint.style.display = "block";   // 显示提示条
        examRemain.textContent = "8.0";    // 重置数字

        const total = 8000;                 // 8 秒
        const startAt = performance.now();  // 记录开始时间

        // 每 100ms 刷一次数
        preIntervalId = setInterval(() => {
            if (!sessionActive) { // 如果用户中途退出了
                clearAllTimers();
                return;
            }

            const elapsed = performance.now() - startAt;
            const left = Math.max(0, total - elapsed);
            const sec = (left / 1000).toFixed(1);  // 保留一位小数
            examRemain.textContent = sec;

            if (left <= 0) {
                clearInterval(preIntervalId);
                preIntervalId = null;
                preHint.style.display = "none"; // 隐藏提示条

                // 现在开始真正“加载题目并启动 10 秒倒计时”
                loadFirstQuestionThenStartMainCountdown();
            }
        }, 100);
    }

    // 第二步：加载第一题 -> 写入页面 -> 开始 10 秒倒计时
    function loadFirstQuestionThenStartMainCountdown() {
        if (!sessionActive) return;

        fetch("data/question_bank.json")
            .then(r => r.json())
            .then(data => {
                if (!sessionActive) return;

                // “共 x 题”
                document.getElementById("total").textContent = data.length;

                // 用第 1 题填入题干与选项
                const q = data[0];
                document.getElementById("question-text").textContent = q.question; // CSS 已设 pre-wrap

                document.getElementById("option-a").innerHTML =
                    "<span class='label'>A.</span> " + q.option_a;
                document.getElementById("option-b").innerHTML =
                    "<span class='label'>B.</span> " + q.option_b;
                document.getElementById("option-c").innerHTML =
                    "<span class='label'>C.</span> " + q.option_c;
                document.getElementById("option-d").innerHTML =
                    "<span class='label'>D.</span> " + q.option_d;

                // 写完题目，开始 10 秒正式倒计时
                startMainCountdown();
            })
            .catch(err => {
                console.error("读取题库失败：", err);
                // 失败的话你也可以在题干处写“加载失败，请重试”
            });
    }

    // 第三步：10 秒倒计时（0.1s 一跳）
    function startMainCountdown() {
        if (mainIntervalId) { clearInterval(mainIntervalId); mainIntervalId = null; }

        const total = 12000;                // 10 秒
        const startAt = performance.now();

        function render() {
            if (!sessionActive) {             // 用户中途退出
                clearAllTimers();
                return;
            }
            const elapsed = performance.now() - startAt;
            const left = Math.max(0, total - elapsed);
            const sec = (left / 1000).toFixed(1);

            if (left > 0) {
                timerSpan.style.color = "black";
                timerSpan.textContent = "请在 " + sec + " 秒内作答";
            } else {
                timerSpan.style.color = "red";
                timerSpan.textContent = "作答超时，本题无效";
                clearInterval(mainIntervalId);
                mainIntervalId = null;
            }
        }

        render(); // 先渲染一帧
        mainIntervalId = setInterval(render, 100);
    }

    // —— 开始答题 ——（切到答题页 → 先显示 5s 准备倒计时）
    btnStart.addEventListener("click", () => {
        sessionActive = true;       // 开始一次新的会话
        clearAllTimers();           // 保底：把旧的都停掉

        resetQuizUI();

        home.classList.add("hidden");
        quiz.classList.remove("hidden");

        timerSpan.style.color = "black";
        timerSpan.textContent = "请在 12.0 秒内作答";  // 先放占位文本

        startPreCountdown();        // 进入 8 秒准备
    });

    // —— 退出答题弹窗 ——（跟你之前一样）
    btnExit.addEventListener("click", () => {
        modal.style.display = "flex";
    });

    btnNo.addEventListener("click", () => {
        modal.style.display = "none";
    });

    btnYes.addEventListener("click", () => {
        // 彻底结束本次会话
        sessionActive = false;
        clearAllTimers();
        timerSpan.textContent = "";

        quiz.classList.add("hidden");
        home.classList.remove("hidden");
        modal.style.display = "none";
    });

    // 点击遮罩关闭
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });
});
