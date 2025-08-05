const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const questionText = document.getElementById("questionText");
const responseText = document.getElementById("responseText");

let recognition;
let fetchController = null;
let currentUtterance = null;


function isAnythingRunning() {
  return recognitionIsRunning || window.speechSynthesis.speaking || currentUtterance;
}

let recognitionIsRunning = false;

if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = function() {
    console.log("Speech recognition started");
    recognitionIsRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
  };

  recognition.onresult = async function(event) {
    const transcript = event.results[0][0].transcript;
    console.log("Speech recognized:", transcript);
    questionText.innerText = transcript;

    fetchController = new AbortController();
    try {
      const res = await fetch("https://voicebot-backend-j7la.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: transcript }),
        signal: fetchController.signal
      });
      const data = await res.json();
      responseText.innerText = data.response;

      const synth = window.speechSynthesis;
      currentUtterance = new SpeechSynthesisUtterance(data.response);
      stopBtn.disabled = false;
      currentUtterance.onend = function() {
        console.log("Speech synthesis ended");
        currentUtterance = null;
        if (!isAnythingRunning()) {
          startBtn.disabled = false;
          stopBtn.disabled = true;
        }
      };
      synth.speak(currentUtterance);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Fetch aborted");
      } else {
        console.error("Fetch error:", error);
      }
      if (!isAnythingRunning()) {
        startBtn.disabled = false;
        stopBtn.disabled = true;
      } else {
        stopBtn.disabled = false;
      }
    } finally {
      fetchController = null;
    }
  };

  recognition.onerror = function(event) {
    console.error("Speech recognition error:", event.error);
    responseText.innerText = `Speech recognition error: ${event.error}`;
    recognitionIsRunning = false;
    if (!isAnythingRunning()) {
      startBtn.disabled = false;
      stopBtn.disabled = true;
    } else {
      stopBtn.disabled = false;
    }
  };

  recognition.onend = function() {
    console.log("Speech recognition ended");
    recognitionIsRunning = false;
    if (!isAnythingRunning()) {
      startBtn.disabled = false;
      stopBtn.disabled = true;
    } else {
      stopBtn.disabled = false;
    }
  };
}

startBtn.addEventListener("click", () => {
  console.log("Start button pressed");
  questionText.innerText = "";
  responseText.innerText = "";
  recognition.start();
});

stopBtn.addEventListener("click", () => {
  console.log("Stop button pressed");

  if (recognitionIsRunning) {
    recognition.abort();
    recognitionIsRunning = false;
  }

  if (fetchController) {
    fetchController.abort();
  }

  if (window.speechSynthesis.speaking || currentUtterance) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }

  questionText.innerText = "";
  responseText.innerText = "Stopped.";

  startBtn.disabled = false;
  stopBtn.disabled = true;
});
