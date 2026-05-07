import { useEffect, useState } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"
import { auth, db } from "./firebase"
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore"

function App() {
  const [word, setWord] = useState("")
  const [result, setResult] = useState(null)
  const [savedWords, setSavedWords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [quizWord, setQuizWord] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState("login")

  useEffect(() => {
    const storedWords = JSON.parse(localStorage.getItem("savedWords")) || []
    setSavedWords(storedWords)
  }, [])

  useEffect(() => {
    localStorage.setItem("savedWords", JSON.stringify(savedWords))
  }, [savedWords])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
  loadSavedWords(currentUser)
} else {
  setSavedWords([])
}
    })
    

    return () => unsubscribe()
  }, [])

  async function handleAuth() {
    try {
      if (authMode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password)
        alert("Account created successfully")
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        alert("Logged in successfully")
      }

      setEmail("")
      setPassword("")
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleLogout() {
    await signOut(auth)
  }
  async function loadSavedWords(currentUser) {
  if (!currentUser) return

  const q = query(
    collection(db, "words"),
    where("userId", "==", currentUser.uid)
  )

  const querySnapshot = await getDocs(q)

  const words = querySnapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }))

  setSavedWords(words)
}

  async function searchWord() {
    if (word.trim() === "") {
      setError("Please enter a word")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      )

      if (!response.ok) {
        setError("Word not found")
        setLoading(false)
        return
      }

      const data = await response.json()
      const wordData = data[0]

      const meaning = wordData.meanings[0]?.definitions[0]?.definition
      const example =
        wordData.meanings[0]?.definitions[0]?.example || "No example available"
      const synonyms = wordData.meanings[0]?.synonyms || []
      const audio = wordData.phonetics.find((item) => item.audio)?.audio || ""

      setResult({
        word: wordData.word,
        meaning,
        example,
        synonyms,
        audio,
      })
    } catch {
      setError("Something went wrong")
    }

    setLoading(false)
  }
async function saveWord() {
  const alreadySaved = savedWords.some(
    (item) => item.word.toLowerCase() === result.word.toLowerCase()
  )

  if (alreadySaved) {
    alert("This word is already saved")
    return
  }

  const newWord = {
    word: result.word,
    meaning: result.meaning,
    example: result.example,
    synonyms: result.synonyms,
    audio: result.audio,
    userId: user.uid,
    createdAt: new Date(),
  }

  const docRef = await addDoc(collection(db, "words"), newWord)

  setSavedWords([...savedWords, { id: docRef.id, ...newWord }])
}
    async function deleteWord(id) {
  await deleteDoc(doc(db, "words", id))

  const updatedWords = savedWords.filter(
    (item) => item.id !== id
  )

  setSavedWords(updatedWords)
}

  function startQuiz() {
    if (savedWords.length === 0) {
      alert("Save some words first")
      return
    }

    const randomIndex = Math.floor(Math.random() * savedWords.length)
    setQuizWord(savedWords[randomIndex])
    setShowAnswer(false)
  }

  function playAudio() {
    if (result?.audio) {
      const audio = new Audio(result.audio)
      audio.play()
    }
  }

  const pageClass = darkMode
    ? "min-h-screen bg-slate-900 text-white"
    : "min-h-screen bg-slate-100 text-slate-900"

  const cardClass = darkMode
    ? "bg-slate-800 text-white"
    : "bg-white text-slate-900"

  return (
    <div className={pageClass}>
      <nav
        className={
          darkMode
            ? "bg-slate-800 shadow px-8 py-4 flex justify-between items-center"
            : "bg-white shadow px-8 py-4 flex justify-between items-center"
        }
      >
        <div>
          <h1 className="text-3xl font-bold text-indigo-500">WordVault</h1>
          <p className={darkMode ? "text-slate-300" : "text-slate-600"}>
            Your smart vocabulary notebook
          </p>
        </div>

        <div className="flex gap-3 items-center">
          {user ? (
            <>
              <p className="text-sm">{user.email}</p>

              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-xl"
              >
                Logout
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-500">Not logged in</p>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-black text-white px-4 py-2 rounded-xl"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </nav>

      <main className="px-8 py-14 text-center">
        <h2 className="text-5xl font-bold mb-5">
          Learn New Words While Reading
        </h2>

        <p
          className={
            darkMode
              ? "text-lg text-slate-300 max-w-2xl mx-auto mb-10"
              : "text-lg text-slate-600 max-w-2xl mx-auto mb-10"
          }
        >
          Search difficult words, understand meanings, save them, and revise
          using flashcards.
        </p>

        {!user && (
          <div className={`${cardClass} max-w-md mx-auto mb-10 p-6 rounded-2xl shadow`}>
            <h3 className="text-2xl font-bold mb-4">
              {authMode === "login" ? "Login" : "Create Account"}
            </h3>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-3 px-4 py-3 rounded-xl border text-slate-900"
            />

            <input
              type="password"
              placeholder="Password minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-4 px-4 py-3 rounded-xl border text-slate-900"
            />

            <button
              onClick={handleAuth}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl"
            >
              {authMode === "login" ? "Login" : "Sign Up"}
            </button>

            <button
              onClick={() =>
                setAuthMode(authMode === "login" ? "signup" : "login")
              }
              className="mt-4 text-indigo-500"
            >
              {authMode === "login"
                ? "New user? Create account"
                : "Already have account? Login"}
            </button>
          </div>
        )}

        {user && (
          <>
            <div className="flex justify-center gap-4 flex-wrap">
              <input
                type="text"
                placeholder="Search a word..."
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchWord()}
                className="w-[350px] px-5 py-3 rounded-xl border border-slate-300 outline-none text-slate-900"
              />

              <button
                onClick={searchWord}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
              >
                Search
              </button>
            </div>

            {loading && <p className="mt-6">Searching...</p>}
            {error && <p className="mt-6 text-red-500">{error}</p>}

            {result && (
              <div className={`${cardClass} max-w-2xl mx-auto mt-8 p-6 rounded-2xl shadow text-left`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-bold text-indigo-500">
                    {result.word}
                  </h3>

                  {result.audio && (
                    <button
                      onClick={playAudio}
                      className="bg-slate-200 text-slate-900 px-4 py-2 rounded-xl"
                    >
                      🔊 Listen
                    </button>
                  )}
                </div>

                <p className="mt-4">
                  <b>Meaning:</b> {result.meaning}
                </p>

                <p className="mt-3">
                  <b>Example:</b> {result.example}
                </p>

                <p className="mt-3">
                  <b>Synonyms:</b>{" "}
                  {result.synonyms.length > 0
                    ? result.synonyms.slice(0, 5).join(", ")
                    : "No synonyms found"}
                </p>

                <button
                  onClick={saveWord}
                  className="mt-5 bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700"
                >
                  Save Word
                </button>
              </div>
            )}

            <section className="max-w-4xl mx-auto mt-14 text-left">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">My Vocabulary</h2>

                <button
                  onClick={startQuiz}
                  className="bg-purple-600 text-white px-5 py-2 rounded-xl"
                >
                  Start Flashcard
                </button>
              </div>

              {savedWords.length === 0 ? (
                <p className={darkMode ? "text-slate-300" : "text-slate-600"}>
                  No words saved yet.
                </p>
              ) : (
                <div className="grid gap-4">
                  {savedWords.map((item, index) => (
                    <div
                      key={index}
                      className={`${cardClass} p-5 rounded-2xl shadow flex justify-between gap-4`}
                    >
                      <div>
                        <h3 className="text-xl font-bold text-indigo-500">
                          {item.word}
                        </h3>
                        <p className="mt-2">{item.meaning}</p>
                      </div>

                      <button
                        onClick={() => deleteWord(item.id)}
                        className="text-red-500 font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {quizWord && (
              <section className={`${cardClass} max-w-xl mx-auto mt-12 p-8 rounded-2xl shadow`}>
                <h2 className="text-2xl font-bold mb-4">Flashcard</h2>

                <h3 className="text-4xl font-bold text-purple-500 mb-6">
                  {quizWord.word}
                </h3>

                {showAnswer ? (
                  <p className="mb-5">{quizWord.meaning}</p>
                ) : (
                  <p className={darkMode ? "text-slate-300 mb-5" : "text-slate-500 mb-5"}>
                    Guess the meaning first.
                  </p>
                )}

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-xl"
                  >
                    Show Answer
                  </button>

                  <button
                    onClick={startQuiz}
                    className="bg-slate-800 text-white px-5 py-2 rounded-xl"
                  >
                    Next Word
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App