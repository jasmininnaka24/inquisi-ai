"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RotateCcw, Play } from "lucide-react"

interface QuizData {
  question: string
  answer: string
  distractions: string[]
}

interface QuizOption {
  text: string
  isCorrect: boolean
}

export default function QuizApp() {
  const [category, setCategory] = useState("")
  const [currentQuiz, setCurrentQuiz] = useState<QuizData | null>(null)
  const [options, setOptions] = useState<QuizOption[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [questionCount, setQuestionCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [gameState, setGameState] = useState<"input" | "playing" | "feedback">("input")

  const fetchQuestion = async (categoryName: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category: categoryName }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch question")
      }

      const data: QuizData = await response.json()
      setCurrentQuiz(data)

      // Shuffle options (correct answer + distractors)
      const allOptions: QuizOption[] = [
        { text: data.answer, isCorrect: true },
        ...data.distractions.map((d) => ({ text: d, isCorrect: false })),
      ]

      // Fisher-Yates shuffle
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]]
      }

      setOptions(allOptions)
      setSelectedAnswer(null)
      setShowFeedback(false)
      setGameState("playing")
    } catch (error) {
      console.error("Error fetching question:", error)
      alert("Failed to fetch question. Make sure your backend is running on http://localhost:8000")
    } finally {
      setIsLoading(false)
    }
  }

  const startQuiz = () => {
    if (!category.trim()) return
    setScore(0)
    setQuestionCount(0)
    fetchQuestion(category)
  }

  const handleAnswerSelect = (selectedText: string) => {
    if (showFeedback) return

    setSelectedAnswer(selectedText)
    setShowFeedback(true)
    setQuestionCount((prev) => prev + 1)

    const selectedOption = options.find((opt) => opt.text === selectedText)
    if (selectedOption?.isCorrect) {
      setScore((prev) => prev + 1)
    }

    setGameState("feedback")
  }

  const nextQuestion = () => {
    fetchQuestion(category)
  }

  const startNewCategory = () => {
    setCategory("")
    setCurrentQuiz(null)
    setOptions([])
    setSelectedAnswer(null)
    setShowFeedback(false)
    setScore(0)
    setQuestionCount(0)
    setGameState("input")
  }

  const getOptionStyle = (option: QuizOption) => {
    if (!showFeedback) {
      return selectedAnswer === option.text
        ? "bg-blue-100 border-blue-300"
        : "bg-white border-gray-200 hover:bg-gray-50"
    }

    if (option.isCorrect) {
      return "bg-green-100 border-green-300 text-green-800"
    }

    if (selectedAnswer === option.text && !option.isCorrect) {
      return "bg-red-100 border-red-300 text-red-800"
    }

    return "bg-gray-100 border-gray-200"
  }

  if (gameState === "input") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Quiz Master</CardTitle>
            <p className="text-gray-600">Enter a category to start your quiz</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-gray-700">
                Category
              </label>
              <Input
                id="category"
                type="text"
                placeholder="e.g., Science, History, Sports..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && startQuiz()}
                className="w-full"
              />
            </div>
            <Button onClick={startQuiz} disabled={!category.trim() || isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Question...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Quiz
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">Quiz Master</h1>
            <Badge variant="secondary" className="text-sm">
              Category: {category}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Score:{" "}
              <span className="font-semibold">
                {score}/{questionCount}
              </span>
            </div>
            <Button onClick={startNewCategory} variant="outline" size="sm" className="bg-white text-gray-700">
              <RotateCcw className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </div>
        </div>

        {/* Question Card */}
        {currentQuiz && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">
                Question #{questionCount + (gameState === "playing" ? 1 : 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">{currentQuiz.question}</p>

              <div className="grid gap-3">
                {options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option.text)}
                    disabled={showFeedback}
                    className={`p-4 text-left border-2 rounded-lg transition-all duration-200 ${getOptionStyle(option)} ${
                      !showFeedback ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium mr-3">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="font-medium">{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback and Next Button */}
        {showFeedback && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                {selectedAnswer === currentQuiz?.answer ? (
                  <div className="text-green-600">
                    <div className="text-2xl font-bold mb-2">🎉 Correct!</div>
                    <p>Great job! You got it right.</p>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <div className="text-2xl font-bold mb-2">❌ Incorrect</div>
                    <p>
                      The correct answer was: <span className="font-semibold">{currentQuiz?.answer}</span>
                    </p>
                  </div>
                )}

                <Button onClick={nextQuestion} disabled={isLoading} className="mt-4">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Next Question...
                    </>
                  ) : (
                    "Next Question"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
