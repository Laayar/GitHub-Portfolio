const questions = [
    {
        question: "What does HTML stand for?",
        answers: [
            { text: "Hyper Text Markup Language", correct: true },
            { text: "Hyperlinks and Text Markup Language", correct: false },
            { text: "Home Tool Markup Language", correct: false },
            { text: "High Transfer Markup Language", correct: false }
        ]
    },
    {
        question: "Which tag is used to create a hyperlink in HTML?",
        answers: [
            { text: "<a>", correct: true },
            { text: "<link>", correct: false },
            { text: "<href>", correct: false },
            { text: "<hyper>", correct: false }
        ]
    },
    {
        question: "Which property is used to change the background color in CSS?",
        answers: [
            { text: "color", correct: false },
            { text: "background-color", correct: true },
            { text: "bgcolor", correct: false },
            { text: "background", correct: false }
        ]
    },
    {
        question: "Inside which HTML element do we put JavaScript?",
        answers: [
            { text: "<js>", correct: false },
            { text: "<script>", correct: true },
            { text: "<javascript>", correct: false },
            { text: "<code>", correct: false }
        ]
    },
    {
        question: "Which CSS property controls the text size?",
        answers: [
            { text: "font-style", correct: false },
            { text: "text-size", correct: false },
            { text: "font-size", correct: true },
            { text: "text-style", correct: false }
        ]
    },
    {
        question: "Which symbol is used for comments in JavaScript?",
        answers: [
            { text: "//", correct: true },
            { text: "/* */", correct: false },
            { text: "<!-- -->", correct: false },
            { text: "#", correct: false }
        ]
    },
    {
        question: "Which of the following is a JavaScript framework?",
        answers: [
            { text: "React", correct: true },
            { text: "Laravel", correct: false },
            { text: "Django", correct: false },
            { text: "Flask", correct: false }
        ]
    },
    {
        question: "Which HTML tag is used to define an image?",
        answers: [
            { text: "<img>", correct: true },
            { text: "<picture>", correct: false },
            { text: "<src>", correct: false },
            { text: "<image>", correct: false }
        ]
    },
    {
        question: "In CSS, how do you select an element with the class name 'container'?",
        answers: [
            { text: "#container", correct: false },
            { text: ".container", correct: true },
            { text: "container", correct: false },
            { text: "*container", correct: false }
        ]
    },
    {
        question: "Which of the following is used to style HTML pages?",
        answers: [
            { text: "JavaScript", correct: false },
            { text: "Python", correct: false },
            { text: "CSS", correct: true },
            { text: "PHP", correct: false }
        ]
    }
];

const questionEl = document.querySelector('#question');
const answerBtnEl = document.querySelector('#answer-buttons');
const nextBtnEl = document.querySelector('#next-btn');

let currentQuestionIndex = 0;
let score = 0;

function startQuiz(){
    currentQuestionIndex = 0;
    score = 0;
    if (nextBtnEl) nextBtnEl.textContent = "Next";
    showQuestion();
}

function showQuestion(){
    resetState();
    let currentQuestion = questions[currentQuestionIndex];
    let questionNo = currentQuestionIndex + 1;
    if (questionEl) questionEl.textContent = questionNo + ". " + currentQuestion.question;

    currentQuestion.answers.forEach(answer =>{
    const button = document.createElement("button")
    button.textContent = answer.text;
        button.classList.add("btn");
        answerBtnEl.appendChild(button);
        if(answer.correct){
            button.dataset.correct = answer.correct;
        }
        button.addEventListener("click", selectAnswer)
    });
}

function resetState(){
    nextBtnEl.style.display = "none";
    while(answerBtnEl.firstChild){
        answerBtnEl.removeChild(answerBtnEl.firstChild);
    }
}

function selectAnswer(e){
    const selectedBtn = e.target;
    const isCorrect = selectedBtn.dataset.correct === "true";
    if (isCorrect) {
        selectedBtn.classList.add("correct");
        score++
    } else {
        selectedBtn.classList.add("incorrect");
    }
    // Disable all answer buttons and show correct answers
    Array.from(answerBtnEl.children).forEach(button => {
        if (button.dataset.correct === "true") {
            button.classList.add("correct");
        }
        button.disabled = true;
    });
    if (nextBtnEl) nextBtnEl.style.display = "block";
}

function showScore(){
    resetState();
    if (questionEl) questionEl.textContent = `You scored ${score} out of ${questions.length}`;
    if (nextBtnEl) {
        nextBtnEl.textContent = "Play Again";
        nextBtnEl.style.display = "block";
    }
}

function handleNextButton(){
    currentQuestionIndex++;
    if(currentQuestionIndex < questions.length){
        showQuestion();
    }else{
        showScore();
    }
}

nextBtnEl.addEventListener("click", ()=>{
    // If there are more questions, go to next. Otherwise restart the quiz.
    if (currentQuestionIndex < questions.length) {
        handleNextButton();
    } else {
        startQuiz();
    }
})

startQuiz()
