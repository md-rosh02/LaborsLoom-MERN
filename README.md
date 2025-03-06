# LaborsLoom - MERN Stack Application

LaborsLoom is a full-stack web application built using the **MERN stack** (MongoDB, Express.js, React, Node.js). This project aims to provide a platform to **connect laborers with job opportunities** and streamline **labor-related task management**. It features a **modern, responsive UI** and a robust backend to handle key functionalities such as **user authentication, job postings, and real-time updates**.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributors](#contributors)
- [License](#license)

## Features
- **User Authentication** (Signup, Login, Logout) with **JWT-based security**
- **Job Posting & Browsing System** for employers and workers
- **Admin Dashboard** for managing users, jobs, and reports
- **RESTful API** for seamless frontend-backend communication

## Tech Stack
- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (with Mongoose ODM)
- **Other Tools:** Git, npm, render ( backend ), vercel (frontend)

## Installation

### Prerequisites
Make sure you have the following installed:
- **Node.js** (v16.x or higher)
- **MongoDB** (local or cloud instance, e.g., MongoDB Atlas)
- **Git**

### Steps to Set Up the Project
#### 1. Clone the Repository
```bash
git clone https://github.com/md-rosh02/LaborsLoom-MERN.git
cd LaborsLoom-MERN
```
#### 2. Install Dependencies
##### For the Backend:
```bash
cd server
npm install
```
##### For the Frontend:
```bash
cd client
npm install
```
#### 3. Configure Environment Variables
Create a **.env** file in the `server` directory with the following values:
```ini
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```
*(Optional)* Create a `.env` file in the `client` directory if needed (e.g., for API endpoints).

#### 4. Run the Application
##### Start the Backend Server:
```bash
cd server
npm run dev
```
##### Start the Frontend:
```bash
cd client
npm start
```
The app should now be running at:
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend:** [http://localhost:5000](http://localhost:5000)

## Usage
1. Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.
2. **Register a new account** to start exploring job listings.
3. Employers can **post new jobs**, while laborers can **browse and apply for jobs**.
4. **Admins** can log in with special credentials to manage users and oversee job postings.

## Project Structure
```
LaborsLoom-MERN/
├── client/              # Frontend (React)
│   ├── public/          # Static assets
│   ├── src/             # React components, pages, and logic
│   └── package.json     # Frontend dependencies
├── server/              # Backend (Node.js/Express)
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   └── package.json     # Backend dependencies
├── .gitignore           # Files/folders to ignore in Git
└── README.md            # Project documentation
```

## Contributors
The following individuals have contributed to the development of LaborsLoom. Thank you for your efforts!

| Name | GitHub Profile | Role/Contributions |
|------|--------------|-------------------|
| **Mohammed Roshan** | [md-rosh02](https://github.com/md-rosh02) | Project Lead, Full-Stack Developer |
| **Manoj Sullad** | [manojcode242](https://github.com/manojcode242) | [Frontend Developer] |
| **Mohammed Tayyab** | [md-tayyab03](https://github.com/md-tayyab03) | [Frontend Developer] |

Want to contribute? Feel free to **fork the repository**, create a feature branch, and submit a pull request. Check out our **Contributing Guidelines** (if applicable) for more details.

## License
This project is licensed under the **REC License**😂. Feel free to break, blast, and distribute it as per the REC terms.

---
_If you find this project useful, consider giving it a ⭐ on GitHub!_ 🚀

