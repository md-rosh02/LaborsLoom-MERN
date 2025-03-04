import React from 'react';

const JobSearch = () => {
  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center">
      {/* Header / Navigation */}
      <header className="w-full bg-black text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold">🔍 LuckyJob</span>
        </div>
        <nav className="space-x-6">
          <a href="#" className="hover:text-gray-300">Find job</a>
          <a href="#" className="hover:text-gray-300">Messages</a>
          <a href="#" className="hover:text-gray-300">Hiring</a>
          <a href="#" className="hover:text-gray-300">Community</a>
          <a href="#" className="hover:text-gray-300">FAQ</a>
        </nav>
        <div className="flex items-center space-x-4">
          <span className="text-sm">New York, NY</span>
          <div className="flex space-x-2">
            <img
              src="https://via.placeholder.com/30"
              alt="User"
              className="rounded-full"
            />
            <div className="flex space-x-2">
              <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
              <span className="w-4 h-4 bg-red-500 rounded-full"></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl p-6 mt-6 bg-white rounded-lg shadow-md">
        {/* Filters */}
        <div className="flex justify-between mb-6">
          <div className="flex space-x-4">
            <select className="border rounded p-2">
              <option>Designer</option>
              {/* Add more options as needed */}
            </select>
            <select className="border rounded p-2">
              <option>Work Location</option>
              {/* Add more options as needed */}
            </select>
            <select className="border rounded p-2">
              <option>Experience</option>
              {/* Add more options as needed */}
            </select>
            <select className="border rounded p-2">
              <option>Per month</option>
              {/* Add more options as needed */}
            </select>
            <div className="flex items-center space-x-2">
              <span>Salary range</span>
              <input
                type="range"
                min="1200"
                max="20000"
                className="w-32"
              />
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Promotional Card */}
          <div className="bg-black text-white p-6 rounded-lg flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold mb-4">Get Your Best Profession with LuckyJob</h2>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Learn more
            </button>
          </div>

          {/* Job Cards */}
          <JobCard
            company="Amazon"
            role="Senior UI/UX Designer"
            date="20 May, 2023"
            schedule="Part time"
            level="Senior level"
            location="San Francisco, CA"
            salary="$250/hr"
            type="Distant"
            logo="https://via.placeholder.com/30"
          />
          <JobCard
            company="Google"
            role="Junior UI/UX Designer"
            date="4 Feb, 2023"
            schedule="Full time"
            level="Junior level"
            location="California, CA"
            salary="$150/hr"
            type="Distant"
            logo="https://via.placeholder.com/30"
          />
          <JobCard
            company="Dribbble"
            role="Senior Motion Designer"
            date="29 Jan, 2023"
            schedule="Part time"
            level="Senior level"
            location="New York, NY"
            salary="$240/hr"
            type="Full Day"
            logo="https://via.placeholder.com/30"
          />
          <JobCard
            company="Twitter"
            role="UX Designer"
            date="11 Apr, 2023"
            schedule="Full time"
            level="Mid level"
            location="California, CA"
            salary="$120/hr"
            type="Distant"
            logo="https://via.placeholder.com/30"
          />
          <JobCard
            company="Airbnb"
            role="Graphic Designer"
            date="2 Apr, 2023"
            schedule="Part time"
            level="Senior level"
            location="New York, NY"
            salary="$300/hr"
            type="Flexible Schedule"
            logo="https://via.placeholder.com/30"
          />
          <JobCard
            company="Apple"
            role="Graphic Designer"
            date="18 Jan, 2023"
            schedule="Part time"
            level="Senior level"
            location="San Francisco, CA"
            salary="$140/hr"
            type="Distant"
            logo="https://via.placeholder.com/30"
          />
        </div>

        {/* Filters Sidebar */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold mb-4">Filters</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Working schedule</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" checked />
                  Full time
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" checked />
                  Part time
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" checked />
                  Internship
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  Project work
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  Volunteering
                </label>
              </div>
            </div>
            <div>
              <h4 className="font-semibold">Employment type</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" checked />
                  Full day
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" checked />
                  Flexible schedule
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" checked />
                  Distant work
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  Shift work
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  Shift method
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const JobCard = ({ company, role, date, schedule, level, location, salary, type, logo }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <img src={logo} alt={`${company} logo`} className="w-6 h-6" />
          <span className="font-bold">{company}</span>
        </div>
        <span className="text-sm text-gray-500">{date}</span>
      </div>
      <h3 className="text-lg font-semibold mb-2">{role}</h3>
      <div className="flex flex-wrap gap-2 mb-2 text-sm text-gray-600">
        <span>{schedule}</span>
        <span>{level}</span>
        <span>{type}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-700">{location}</span>
        <span className="font-bold text-gray-800">{salary}</span>
        <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
          Details
        </button>
      </div>
    </div>
  );
};

export default JobSearch;