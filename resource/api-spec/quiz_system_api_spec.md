# Quiz System API Specification

This document provides a comprehensive specification for the Quiz Management System (Express + MongoDB).

## 1. General Configuration
- **Base URL**: `http://localhost:5000` (Local) / `http://150.15.79.45:5000` (Production)
- **Content-Type**: `application/json`
- **Response Format**: 
  ```json
  {
    "success": boolean,
    "message": string,
    "data": any
  }
  ```

---

## 2. Quiz Management APIs

### 2.1 List All Quizzes
- **Method**: `GET`
- **Path**: `/api/quizzes`
- **Query Params**:
  - `status`: `draft` | `published` | `archived`
  - `category`: string
- **Response**: `QuizListResult` (Array of quizzes without questions)

### 2.2 Get Quiz Details
- **Method**: `GET`
- **Path**: `/api/quizzes/:id`
- **Response**: `Quiz` object including full `questions` list.

### 2.3 Create Quiz
- **Method**: `POST`
- **Path**: `/api/quizzes`
- **Body**: `QuizFormData`
- **Description**: Creates quiz metadata. Questions are usually added via `updateQuiz`.

### 2.4 Update Quiz (Full Save)
- **Method**: `PUT`
- **Path**: `/api/quizzes/:id`
- **Body**: `Partial<Quiz> & { questions: Question[] }`
- **Description**: The primary endpoint for the Quiz Builder. Saves both metadata and the full question list.

### 2.5 Set Status
- **Method**: `PATCH`
- **Path**: `/api/quizzes/:id/status`
- **Body**: `{ "status": "draft" | "published" | "archived" }`

### 2.6 Delete Quiz
- **Method**: `DELETE`
- **Path**: `/api/quizzes/:id`

### 2.7 Generate Access Code
- **Method**: `POST`
- **Path**: `/api/quizzes/:id/generate-code`
- **Description**: Generates a short code (e.g., RX-9201) for students to join.

---

## 3. Student Play APIs

### 3.1 Get Quiz by Access Code
- **Method**: `GET`
- **Path**: `/api/play/:code`
- **Description**: Used by students to join a quiz session.

---

## 4. Image Management APIs

### 4.1 Upload Image
- **Method**: `POST`
- **Path**: `/api/quizzes/images/upload`
- **Content-Type**: `multipart/form-data`
- **Body**: `image` (File)
- **Response**: `{ "url": "/uploads/filename.jpg" }`

### 4.2 Delete Image
- **Method**: `DELETE`
- **Path**: `/api/quizzes/images/:filename`

---

## 5. Data Models (Reference)

### Quiz Object
```typescript
interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  durationMinutes: number;
  status: "draft" | "published" | "archived";
  accessCode?: string;
  imageUrl?: string;
  questions: Question[];
}
```

### Question Object
```typescript
interface Question {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  text: string;
  imageUrl?: string;
  order: number;
  choices: Choice[];
}
```

### Choice Object
```typescript
interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
}
```


1 Mr. Bordinth Srihakhun
2 Miss Jeerawan Prasertsri 
3 Miss Nattakarn Prayongsook
4 Miss Phattharanan Akhad 
5 Mr. Phonlakrit Somsong
6 Mr. Pachara Chamraxsa
7 Mr. Mekmai Jankeaw
8 Mr. Nithis Manora
9 Mr. Racharnon Srichai
10 Mr. Sakda Baokham
11 Mr. Kritsanapong Pornphu
12 Mr. Sirawit Sirisalung
13 Mr. Natthawut Malakong
14 Miss Kanokwan Yodpheng
15 Mr. Khwanchai Phomdach 
16 Mr. Wachirawit Seedee
17 Miss. Kodchakon Komarvuth
18 Miss. Sirorat Sangam
19 Mr. Panyapat Raksaboon
20 Mr. Phiraphat Putpun
21 Miss Napassorn Kaewpai
22 Mr. Sinlapakorn Saenjinda
