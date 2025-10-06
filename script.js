const btnStart = document.getElementById("btn-start");
const home = document.getElementById("home");
const quiz = document.getElementById("quiz");

btnStart.addEventListener("click", () => {
    home.classList.add("hidden");
    quiz.classList.remove("hidden");
});
