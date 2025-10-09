document.addEventListener("DOMContentLoaded", function () {
    // —— 状态与定时器（都只做这件事：要么开，要么关）——
    let questionBank = null;
    let bankReady = null;

    let sessionActive = false;       // 当前是否在一次“考试会话”中
    let mainIntervalId = null;       // 12 秒“正式倒计时”的 interval

    let hasStarted = false;                      // 是否已经开始正式计时/作答

    let currentIndex = 0;   // 当前题号
    let score = 0;          // 得分

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
    const btnAction = document.getElementById("btn-action");  // 切换用的单按钮
    const btnSubmit = document.getElementById("btn-submit");

    const btnExit = document.getElementById("btn-exit");

    const modal = document.getElementById("exit-modal");
    const btnYes = document.getElementById("btn-exit-yes");
    const btnNo = document.getElementById("btn-exit-no");

    const result = document.getElementById("result");

    const totalScore = document.getElementById("total-score");
    const correctCount = document.getElementById("correct-count");
    const wrongCount = document.getElementById("wrong-count");

    const btnBack = document.getElementById("btn-back");

    bankReady = fetch("data/question_bank.json")
        .then(r => r.json())
        .then(data => {
            questionBank = data;
            console.log("题库已加载，共", data.length, "题");
        })
        .catch(err => {
            console.error("预加载题库失败：", err);
        });

    function resetQuizUI() {
        // 题干先用占位（保持你想要的默认值）
        questionEl.textContent = "题干";

        // 选项也先用占位
        optionA.textContent = "A 选项";
        optionB.textContent = "B 选项";
        optionC.textContent = "C 选项";
        optionD.textContent = "D 选项";
    }

    // 工具：清空所有计时器
    function clearAllTimers() {
        if (mainIntervalId) {
            clearInterval(mainIntervalId);
            mainIntervalId = null;
        }
    }

    // 加载第一题 -> 写入页面 -> 开始 12 秒倒计时
    function loadQuestion(index) {
        if (!sessionActive) return;
        if (!questionBank) return;

        if (index >= questionBank.length) {
            quiz.classList.add("hidden");
            result.classList.remove("hidden");

            totalScore.textContent = score * 100 / questionBank.length;
            correctCount.textContent = score;
            wrongCount.textContent = questionBank.length - score;

            return;
        }

        const q = questionBank[index];
        document.getElementById("total").textContent = questionBank.length;
        document.getElementById("current").textContent = index + 1;

        questionEl.textContent = q.question;
        optionA.innerHTML = "<span class='label'>A.</span> " + q.option_a;
        optionB.innerHTML = "<span class='label'>B.</span> " + q.option_b;
        optionC.innerHTML = "<span class='label'>C.</span> " + q.option_c;
        optionD.innerHTML = "<span class='label'>D.</span> " + q.option_d;

        startMainCountdown();
    }

    // 第三步：12 秒倒计时（0.1s 一跳）
    function startMainCountdown() {
        if (mainIntervalId) { clearInterval(mainIntervalId); mainIntervalId = null; }

        const total = 12000;
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
                timerSpan.textContent = "作答超时";
                clearInterval(mainIntervalId);
                mainIntervalId = null;

                // 禁用选项和跳过按钮
                optionA.disabled = true;
                optionB.disabled = true;
                optionC.disabled = true;
                optionD.disabled = true;
                btnAction.disabled = true;

                // 1 秒后进入下一题并恢复按钮
                setTimeout(() => {
                    optionA.disabled = false;
                    optionB.disabled = false;
                    optionC.disabled = false;
                    optionD.disabled = false;
                    btnAction.disabled = false;

                    currentIndex++;
                    loadQuestion(currentIndex);
                }, 1000);
            }
        }

        render(); // 先渲染一帧
        mainIntervalId = setInterval(render, 100);
    }

    function handleAnswer(choice) {
        const q = questionBank[currentIndex];
        if (choice === q.correct_answer) {
            score++;
        }

        currentIndex++;
        loadQuestion(currentIndex);
    }

    optionA.addEventListener("click", () => handleAnswer("a"));
    optionB.addEventListener("click", () => handleAnswer("b"));
    optionC.addEventListener("click", () => handleAnswer("c"));
    optionD.addEventListener("click", () => handleAnswer("d"));

    // —— 开始答题 ——（切到答题页 → 先显示 5s 准备倒计时）
    btnStart.addEventListener("click", () => {
        sessionActive = true;
        clearAllTimers();
        resetQuizUI();

        home.classList.add("hidden");
        quiz.classList.remove("hidden");

        hasStarted = false;
        document.getElementById("progress").style.display = "none";
        timerSpan.textContent = "请在知悉页面布局后开始作答";
        timerSpan.style.color = "black";
        document.querySelector(".info-bar").classList.add("center");

        optionA.disabled = true;
        optionB.disabled = true;
        optionC.disabled = true;
        optionD.disabled = true;

        btnSubmit.disabled = true;

        // 根据题库是否已就绪设置“开始作答”按钮
        if (questionBank) {
            btnAction.textContent = "开始作答";
            btnAction.disabled = false;
            btnAction.classList.remove("btn-secondary");
            btnAction.classList.add("btn-primary");
        } else {
            btnAction.textContent = "加载中…";
            btnAction.disabled = true; // 题库未就绪先禁用
            btnAction.classList.remove("btn-secondary");
            btnAction.classList.add("btn-primary");

            // 题库就绪后自动恢复
            bankReady?.then(() => {
                if (!sessionActive || hasStarted) return; // 已退出或已开始就不改了
                btnAction.textContent = "开始作答";
                btnAction.disabled = false;
            });
        }
    });

    btnAction.addEventListener("click", async () => {
        if (!hasStarted) {
            hasStarted = true;

            btnAction.textContent = "跳过本题";
            btnAction.classList.remove("btn-primary");
            btnAction.classList.add("btn-secondary");
            btnAction.blur();

            optionA.disabled = false;
            optionB.disabled = false;
            optionC.disabled = false;
            optionD.disabled = false;

            btnSubmit.disabled = false;
            document.getElementById("progress").style.display = "inline";
            document.querySelector(".info-bar").classList.remove("center");

            currentIndex = 0;
            score = 0;

            // 关键：确保题库已就绪
            if (!questionBank) {
                try { await bankReady; } catch (e) { console.error(e); return; }
                if (!questionBank) return; // 失败就别往下走了
            }

            loadQuestion(currentIndex);
        } else {
            currentIndex++;
            loadQuestion(currentIndex);
        }
    });

    // —— 退出答题弹窗 ——（跟你之前一样）
    btnExit.addEventListener("click", () => {
        if (sessionActive === true && hasStarted === false) {
            sessionActive = false;
            clearAllTimers();
            timerSpan.textContent = "";

            quiz.classList.add("hidden");
            home.classList.remove("hidden");
            modal.style.display = "none";
        } else {
            modal.style.display = "flex";
        }
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

    btnBack.addEventListener("click", () => {
        sessionActive = false;        // 🔑 彻底结束会话
        clearAllTimers();             // 停止倒计时
        currentIndex = 0;             // 重置题号
        score = 0;                    // 重置分数

        quiz.classList.add("hidden");
        result.classList.add("hidden");
        home.classList.remove("hidden");
    });
});
