# CrowdLens 🔍

**Turn online conversations into actionable insights.**

CrowdLens is an AI-powered audience intelligence platform that analyzes public online discussions to uncover recurring opinions, audience needs, common complaints, and growth opportunities. It transforms scattered conversations into structured insights that help creators, businesses, and organizations better understand their audiences.

---

## 📌 About the Project

People share valuable opinions, feedback, questions, and suggestions across platforms like YouTube, Instagram, and other online communities every day. However, finding meaningful patterns in thousands of conversations manually is time-consuming.

CrowdLens aims to solve this problem by automating the process of collecting and analyzing publicly available discussions using AI-powered web extraction and analysis.

Instead of simply collecting comments, CrowdLens focuses on understanding what people are actually saying and identifying patterns that can lead to meaningful decisions.

## ✨ Key Features

- **Audience Insights:** Discover recurring opinions, interests, and audience sentiment.
- **Pain Point Detection:** Identify common complaints, unanswered questions, and problems faced by audiences.
- **Audience Voice:** Understand what people are discussing through real feedback and comments.
- **Growth Opportunities:** Uncover content ideas, product improvements, and potential opportunities based on audience needs.
- **Comment Explorer:** Explore extracted discussions and individual audience responses.
- **Visual Analytics:** Present findings through charts, graphs, and structured reports.
- **Report Export:** Export analyzed insights into a shareable PDF report.

## ⚙️ How It Works

1. **Enter a URL:** Provide a publicly accessible page or discussion URL.
2. **Data Extraction:** CrowdLens uses TinyFish to navigate and extract relevant publicly available discussions.
3. **AI-Powered Analysis:** The collected information is processed to identify recurring themes, opinions, complaints, and audience requirements.
4. **Insight Generation:** Extracted information is organized into meaningful categories and actionable opportunities.
5. **Visual Report:** The results are presented through an interactive dashboard with charts, insights, and audience feedback.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML, CSS, JavaScript | Frontend and user interface |
| Node.js | Backend runtime |
| Express.js | Backend API and routing |
| TinyFish | Web automation and data extraction |
| Chart.js | Data visualization |
| dotenv | Environment configuration |

## 📂 Project Structure

```text
CrowdLens/
│
├── backend/
│   ├── routes/
│   │   └── analyze.js
│   ├── services/
│   │   └── tinyfish.js
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── .gitignore
└── README.md
```

*Note: The structure above represents the project's intended organization. Adjust it if your actual repository differs.*

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- TinyFish API access

### Installation

**1. Clone the repository**

```bash
git clone <YOUR_REPOSITORY_URL>
cd CrowdLens
```

**2. Install backend dependencies**

```bash
cd backend
npm install
```

**3. Configure environment variables**

Create a `.env` file inside the backend directory:

```env
PORT=5050
TINYFISH_API_KEY=your_api_key_here
```

**4. Start the backend server**

```bash
npm run dev
```

**5. Launch the frontend**

Open `frontend/index.html` in your browser or use a local development server.

## 🎯 Project Objective

CrowdLens is built around a simple idea: **the internet is full of conversations, and those conversations contain valuable insights.**

The goal is to make audience understanding faster, more accessible, and more actionable by turning unstructured online discussions into meaningful information.

## 🔮 Future Scope

- Support for more social media and community platforms.
- Advanced sentiment and emotion analysis.
- AI-generated content and business recommendations.
- Competitor and market research.
- Historical trend analysis and audience behavior tracking.

## 🤝 Contributing

Contributions, suggestions, and ideas are welcome. Feel free to fork the repository and explore ways to improve CrowdLens.

---

**Built with curiosity, AI, and the belief that every conversation has something to reveal.**
